"use server";

import {auth} from "@/auth/auth";
import db from "@/prisma/client";
import {setAutoplayMusicForm} from "./validator";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/client";

interface SetAccountInfoSuccessResult<T> {
	success: true;
	result: T;
}

interface SetAccountInfoFailureResult {
	success: false;
	message: string;
	requireRefresh: boolean;
}

type SetAccountInfoResult<T> = SetAccountInfoSuccessResult<T> | SetAccountInfoFailureResult;

export async function setAutoplayMusic(data: unknown): Promise<SetAccountInfoResult<boolean>> {
	const check = setAutoplayMusicForm.safeParse(data);

	if (!check.success) {
		return {
			success: false,
			message: check.error.issues[0].message,
			requireRefresh: false,
		};
	}

	const changeValue: boolean = check.data;

	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return {
			success: false,
			message: "로그인이 필요해요. 다시 로그인해 주세요.",
			requireRefresh: false,
		};
	}

	const userId: string = authInfo.user.id;

	try {
		const updateResult = await db.user.update({
			data: {
				autoplayMusic: changeValue,
			},
			where: {
				id: userId,
			},
		});

		return {
			success: true,
			result: updateResult.autoplayMusic,
		};
	} catch (err) {
		console.error(err);

		/* 세션은 남아 있는데 계정 행이 지워졌으면 update가 대상 행을 못 찾아 P2025로 떨어진다. */
		if (err instanceof PrismaClientKnownRequestError && err.code === "P2025") {
			return {
				success: false,
				message: "계정을 찾을 수 없어요. 다시 로그인해 주세요.",
				requireRefresh: false,
			};
		}

		return {
			success: false,
			message: "자동 재생 설정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
			requireRefresh: false,
		};
	}
}
