import {auth} from "@/auth/auth";
import type {SettingAccount} from "./validator";
import db from "@/prisma/client";
import {cache} from "react";
import {getSessionUser} from "@/auth/sessionUser";

type FailureReason = "notLoggedIn" | "notFound";

interface GetAccountInfoSuccessResult {
	success: true;
	result: SettingAccount;
}

interface GetAccountInfoFailureResult {
	success: false;
	reason: FailureReason;
}

type GetAccountInfoResult = GetAccountInfoSuccessResult | GetAccountInfoFailureResult;

export type KoreanSocialProvider = ReturnType<typeof toKoreanSocialProvider>;

function toKoreanSocialProvider(provider: string) {
	switch (provider) {
		case "normal":
			return "일반";

		case "google":
			return "구글";

		case "naver":
			return "네이버";

		case "kakao":
			return "카카오";

		case "twitter":
			return "X";

		default:
			return "알 수 없음";
	}
}

export const getMyAccountInfo = cache(async (): Promise<GetAccountInfoResult> => {
	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return {
			success: false,
			reason: "notLoggedIn",
		};
	}

	/* 자동 재생 설정은 auth()가 세션 버전을 확인하며 이미 읽어 둔 행에서 가져온다(같은 요청이면 cache로 한 번만 조회). */
	const [userInfo, sessionUser] = await Promise.all([
		db.account.findUnique({
			where: {
				userId: authInfo.user.id,
			},
			select: {
				provider: true,
				user: {
					select: {
						email: true,
						username: true,
					},
				},
			},
		}),
		getSessionUser(authInfo.user.id),
	]);

	if (userInfo === null || userInfo.user === null || sessionUser === null) {
		return {
			success: false,
			reason: "notFound",
		};
	}

	return {
		success: true,
		result: {
			email: userInfo.user.email || null,
			username: userInfo.user.username || "알 수 없음",
			socialProvider: toKoreanSocialProvider(userInfo.provider),
			autoplayMusic: sessionUser.autoplayMusic,
		},
	};
});

/** 보는 사람의 테마곡 자동 재생 설정. 비로그인 방문자와 계정을 못 찾은 경우는 켜짐으로 본다.
 *  프로필 페이지는 이메일, 사용자 이름이 필요 없어서 계정(Account) 조회 없이 이것만 쓴다. */
export const getMyAutoplayMusic = cache(async (): Promise<boolean> => {
	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return true;
	}

	const sessionUser = await getSessionUser(authInfo.user.id);

	return sessionUser?.autoplayMusic ?? true;
});
