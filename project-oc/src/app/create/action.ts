"use server";

import {auth} from "@/auth/auth";
import {createCharServerForm, MAX_TEMPLATE_LIMIT, type CreateCharServerFormType} from "./validator";
import db from "@/prisma/client";
import {v7 as uuidv7} from "uuid";
import {charImageBucket, charImageKey, charImageTempKey, copyCharImage, headCharImage, removeCharImage} from "./r2";
import {IMAGE_MAX_FILE_SIZE, IMAGE_UPLOAD_TYPE} from "./imageEditor";

export type CreateCharActionResult = {success: true; link: string} | {success: false; message: string};

function uuidToBin(uuid: string) {
	const hex = uuid.replaceAll("-", "");
	return Buffer.from(hex, "hex");
}

function binToUuid(buffer: Buffer) {
	const hex = buffer.toString("hex");
	return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32)].join("-");
}

export default async function createCharAction(data: CreateCharServerFormType): Promise<CreateCharActionResult> {
	const authInfo = await auth();

	if (authInfo === null || !authInfo.user) {
		return {success: false, message: "로그인이 안 되어 있어요. 로그인 후 이용해 주세요."};
	}

	const check = createCharServerForm.safeParse(data);

	if (!check.success) {
		return {success: false, message: check.error.issues[0].message};
	}

	const user = await db.user.findUnique({
		where: {
			id: authInfo.user.id,
		},
		include: {
			characters: {
				select: {
					charId: true,
					charImage: true,
				},
			},
		},
	});

	if (user === null) {
		return {success: false, message: "접속 한 계정 정보를 찾을 수 없어요."};
	} else if (user.characters.length >= MAX_TEMPLATE_LIMIT) {
		return {success: false, message: `더 이상 템플릿을 만들 수 없어요. 템플릿은 최대 ${MAX_TEMPLATE_LIMIT}개 까지 만들 수 있어요.`};
	}

	const charImageName: string = check.data.charImageName;
	const bucket: string = charImageBucket(parseInt(check.data.publicMode, 10));
	const tempKey: string = charImageTempKey(user.id, charImageName);
	const key: string = charImageKey(user.id, charImageName);

	/* 이미 다른 캐릭터가 쓰는 이미지를 가리키면 나중에 한쪽을 지울 때 남은 쪽의
	   이미지까지 사라진다. 이름은 업로드마다 새로 발급되므로 정상 흐름에서는
	   걸릴 일이 없고, 손으로 만든 요청만 여기서 막힌다. */
	if (user.characters.some((character) => character.charImage === charImageName)) {
		return {success: false, message: "이미 사용 중인 이미지예요. 이미지를 다시 올려 주세요."};
	}

	/* 업로드는 브라우저가 직접 했으므로 올라왔다는 말을 그대로 믿지 않고 확인한다.
	   여기서 못 찾으면 아직 아무것도 올라오지 않았다는 뜻이라 지울 것도 없다. */
	let uploaded;

	try {
		uploaded = await headCharImage(bucket, tempKey);
	} catch {
		return {success: false, message: "이미지 업로드가 확인되지 않았어요. 이미지를 다시 올려 주세요."};
	}

	const uploadedSize: number = uploaded.ContentLength ?? 0;

	if (uploaded.ContentType !== IMAGE_UPLOAD_TYPE || uploadedSize <= 0 || uploadedSize > IMAGE_MAX_FILE_SIZE) {
		await removeCharImage(bucket, tempKey);

		return {success: false, message: "이미지가 올바르지 않아요. 이미지를 다시 올려 주세요."};
	}

	try {
		const publicLink: string = uuidv7();

		/* 검증을 마친 뒤에야 최종 경로로 옮긴다. 여기서부터는 실패해도 사본이 남으므로
		   아래 catch에서 두 경로를 모두 지운다. */
		await copyCharImage(bucket, tempKey, key);

		await db.$transaction(async (t) => {
			let charTmi: string[] = check.data.charTmi.split("\n");

			charTmi = charTmi.filter((tmi) => tmi.trim());

			const publicLinkBin = uuidToBin(publicLink);

			await t.character.create({
				data: {
					charName: check.data.charName,
					charImage: charImageName,
					charProfileLayout: check.data.charProfileLayout,
					charImageFrame: check.data.charImageFrame,
					charMessage: check.data.charMessage,
					charKind: check.data.charKind || null,
					charColor: check.data.charColor,
					charMusic: check.data.charMusic || null,
					charLike: check.data.charLike.trim() ? check.data.charLike : null,
					charHate: check.data.charHate.trim() ? check.data.charHate : null,
					charMbti: check.data.charMbti.trim() ? check.data.charMbti : null,
					charBirthplace: check.data.charBirthplace.trim() ? check.data.charBirthplace : null,
					charAge: check.data.charAge.trim() ? check.data.charAge : null,
					charBirthday: check.data.charBirthday.trim() ? check.data.charBirthday : null,
					charHeight: check.data.charHeight.trim() ? check.data.charHeight : null,
					charPersonality: check.data.charPersonality.trim() ? check.data.charPersonality : null,
					charTmi,
					charPublicMode: parseInt(check.data.publicMode, 10),
					aiUsed: parseInt(check.data.aiUsed, 10),
					charPublicLink: publicLinkBin,
					charUploaderId: user.id,
				},
			});
		});

		/* 등록이 끝났으니 임시 사본은 쓸모가 없다. 지우지 못해도 수명 주기 규칙이
		   하루 뒤 정리하므로 여기서 실패를 따로 다루지 않는다. */
		await removeCharImage(bucket, tempKey);

		return {success: true, link: `/template/${publicLink}`};
	} catch (err) {
		/* 등록이 깨지면 올라간 이미지는 어디서도 참조되지 않는 채로 남아 요금만
		   나간다. 사용자에게 보여줄 메시지와 별개로 여기서 반드시 지운다.
		   복사 전에 깨졌다면 최종 경로 삭제는 그냥 헛일이 될 뿐이라 무해하다. */
		console.error("템플릿 등록 실패", err);

		await Promise.all([removeCharImage(bucket, key), removeCharImage(bucket, tempKey)]);

		return {success: false, message: "템플릿 등록에 실패했어요. 다시 시도해 주세요."};
	}
}
