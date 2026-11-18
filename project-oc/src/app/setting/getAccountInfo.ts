import {auth} from "@/auth/auth";
import type {SettingAccount} from "./validator";
import db from "@/prisma/client";
import {cache} from "react";

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

	const userInfo = await db.account.findUnique({
		where: {
			userId: authInfo.user.id,
		},
		select: {
			provider: true,
			user: {
				select: {
					email: true,
					username: true,
					autoplayMusic: true,
				},
			},
		},
	});

	if (userInfo === null || userInfo.user === null) {
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
			autoplayMusic: userInfo.user.autoplayMusic,
		},
	};
});
