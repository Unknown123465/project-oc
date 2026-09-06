"use server";

import {auth} from "@/auth/auth";
import {createCharForm, type CreateCharFormType} from "./validator";
import db from "@/prisma/client";
import {v4 as uuidv4, v7 as uuidv7} from "uuid";

export type CreateCharActionResult = {success: true; link: string} | {success: false; message: string};

const MAX_TEMPLATE_LIMIT = 10;

function uuidToBin(uuid: string) {
	const hex = uuid.replaceAll("-", "");
	return Buffer.from(hex, "hex");
}

function binToUuid(buffer: Buffer) {
	const hex = buffer.toString("hex");
	return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32)].join("-");
}

export default async function createCharAction(data: CreateCharFormType): Promise<CreateCharActionResult> {
	const authInfo = await auth();

	if (authInfo === null || !authInfo.user) {
		return {success: false, message: "로그인이 안 되어 있어요. 로그인 후 이용해 주세요."};
	}

	const check = createCharForm.safeParse(data);

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
				},
			},
		},
	});

	if (user === null) {
		return {success: false, message: "접속 한 계정 정보를 찾을 수 없어요."};
	} else if (user.characters.length >= MAX_TEMPLATE_LIMIT) {
		return {success: false, message: `더 이상 템플릿을 만들 수 없어요. 템플릿은 최대 ${MAX_TEMPLATE_LIMIT}개 까지 만들 수 있어요.`};
	}

	try {
		//TODO: 클라우드플레어 R2 연동 및 업로드 코드 부분

		const publicUUID: string = await db.$transaction(async (t) => {
			const charImageName: string = uuidv4() + ".png";
			let charTmi: string[] = data.charTmi.split("\n");

			charTmi = charTmi.filter((tmi) => tmi.trim());

			const publicLink: string = uuidv7();
			const publicLinkBin = uuidToBin(publicLink);

			await t.character.create({
				data: {
					charName: data.charName,
					charImage: charImageName,
					charProfileLayout: data.charProfileLayout,
					charImageFrame: data.charImageFrame,
					charMessage: data.charMessage,
					charKind: data.charKind || null,
					charColor: data.charColor,
					charMusic: data.charMusic || null,
					charLike: data.charLike.trim() ? data.charLike : null,
					charHate: data.charHate.trim() ? data.charHate : null,
					charMbti: data.charMbti.trim() ? data.charMbti : null,
					charBirthplace: data.charBirthplace.trim() ? data.charBirthplace : null,
					charAge: data.charAge.trim() ? data.charAge : null,
					charBirthday: data.charBirthday.trim() ? data.charBirthday : null,
					charHeight: data.charHeight.trim() ? data.charHeight : null,
					charPersonality: data.charPersonality.trim() ? data.charPersonality : null,
					charTmi,
					charPublicMode: parseInt(data.publicMode, 10),
					aiUsed: parseInt(data.aiUsed, 10),
					charPublicLink: publicLinkBin,
					charUploaderId: user.id,
				},
			});

			return publicLink;
		});

		return {success: true, link: `/template/${publicUUID}`};
	} catch (err) {
		//TODO: 클라우드플레어 R2 연동 및 삭제 코드 부분

		return {success: false, message: "템플릿 등록에 실패했어요. 다시 시도해 주세요."};
	}
}
