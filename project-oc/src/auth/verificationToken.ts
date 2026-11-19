import "server-only";
import crypto from "crypto";
import {cache} from "react";
import db from "@/prisma/client";

interface GetEmailChangeRequestResult {
	userId: string;
	userName: string;
	newEmail: string;
}

export const EMAIL_CHANGE_TOKEN_TYPE = "email-change" as const;

/** 이메일 변경 링크를 쓸 수 있는 시간(분). 이 시간 안에는 다시 요청할 수도 없다. */
export const EMAIL_CHANGE_TOKEN_MINUTES = 5 as const;

/* 32바이트 난수를 base64url로 바꾸면 43자가 된다. 주소창에서 받은 값이 이 모양이 아니면
   해시를 계산하거나 DB를 볼 필요 없이 바로 쓸 수 없는 링크로 본다. */
const RAW_TOKEN_PATTERN: RegExp = /^[A-Za-z0-9_-]{43}$/;

/** 메일 링크에 넣을 원본 토큰. DB에는 이 값이 아니라 hashToken의 결과만 저장한다. */
export function createRawToken(): string {
	return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(rawToken: string): string {
	return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function isRawToken(value: string): boolean {
	return RAW_TOKEN_PATTERN.test(value);
}

/* 링크를 열었을 때 페이지와 generateMetadata가 같이 쓴다. cache로 한 요청 안에서는 한 번만 조회한다.
   만료됐거나, 없거나, 요청한 계정이 그사이 지워졌으면 null이다. 토큰을 쓰지는 않는다. */
export const getEmailChangeRequest = cache(async (rawToken: string): Promise<GetEmailChangeRequestResult | null> => {
	if (!isRawToken(rawToken)) {
		return null;
	}

	const request = await db.verificationToken.findUnique({
		where: {
			token: hashToken(rawToken),
		},
		select: {
			identifier: true,
			type: true,
			newEmail: true,
			expires: true,
		},
	});

	if (request === null || request.newEmail === null || request.type !== EMAIL_CHANGE_TOKEN_TYPE || request.expires.getTime() <= Date.now()) {
		return null;
	}

	const user = await db.user.findUnique({
		where: {
			id: request.identifier,
		},
		select: {
			username: true,
		},
	});

	if (user === null) {
		return null;
	}

	return {
		userId: request.identifier,
		userName: user.username ?? "알 수 없음",
		newEmail: request.newEmail,
	};
});
