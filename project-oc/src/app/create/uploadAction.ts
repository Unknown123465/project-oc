"use server";

import {PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {v4 as uuidv4} from "uuid";
import {auth} from "@/auth/auth";
import db from "@/prisma/client";
import {charImageBucket, charImageTempKey, r2} from "./r2";
import {IMAGE_UPLOAD_TYPE} from "./imageEditor";
import {MAX_TEMPLATE_LIMIT, uploadTicket, type UploadTicketType} from "./validator";

export type CreateUploadUrlResult = {success: true; uploadUrl: string; imageName: string} | {success: false; message: string};

/* 서명이 살아 있는 동안은 URL을 쥔 쪽이 언제든 올릴 수 있으므로 짧게 끊는다.
   업로드는 폼을 제출한 직후 한 번뿐이고, 실패하면 새로 발급받으면 된다. */
const UPLOAD_URL_MAX_AGE: number = 180;

export default async function createUploadUrlAction(ticket: UploadTicketType): Promise<CreateUploadUrlResult> {
	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return {success: false, message: "로그인이 안 되어 있어요. 로그인 후 이용해 주세요."};
	}

	const check = uploadTicket.safeParse(ticket);

	if (!check.success) {
		return {success: false, message: check.error.issues[0].message};
	}

	/* 여기서 한도를 막지 않으면 어차피 등록에서 걸릴 이미지가 버킷에 그대로 쌓인다. */
	const charCount: number = await db.character.count({
		where: {
			charUploaderId: authInfo.user.id,
		},
	});

	if (charCount >= MAX_TEMPLATE_LIMIT) {
		return {success: false, message: `더 이상 템플릿을 만들 수 없어요. 템플릿은 최대 ${MAX_TEMPLATE_LIMIT}개 까지 만들 수 있어요.`};
	}

	/* 키를 서버가 정해야 클라이언트가 남의 오브젝트나 이미 등록된 이미지를
	   덮어쓰도록 유도할 수 없다. */
	const imageName: string = `${uuidv4()}.png`;

	try {
		/* 서명은 임시 경로에만 내준다. 등록을 마친 이미지가 놓이는 최종 경로에는
		   서버만 쓸 수 있어야, 등록된 남의 이미지를 덮어쓰는 길이 열리지 않는다. */
		const uploadUrl: string = await getSignedUrl(
			r2(),
			new PutObjectCommand({
				Bucket: charImageBucket(parseInt(check.data.publicMode, 10)),
				Key: charImageTempKey(authInfo.user.id, imageName),
				/* 서명에 넣은 값과 브라우저가 실제로 보낸 헤더가 다르면 R2가 업로드를
				   거부한다. 이 두 줄이 "PNG만, 이 크기만"을 업로드 시점에 강제한다. */
				ContentType: IMAGE_UPLOAD_TYPE,
				ContentLength: check.data.size,
			}),
			{expiresIn: UPLOAD_URL_MAX_AGE},
		);

		return {success: true, uploadUrl, imageName};
	} catch (err) {
		console.error("R2 업로드 URL 발급 실패", err);

		return {success: false, message: "이미지 업로드를 준비하지 못했어요. 잠시 후 다시 시도해 주세요."};
	}
}
