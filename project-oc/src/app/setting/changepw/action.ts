"use server";

import "server-only";
import {cookies} from "next/headers";
import db from "@/prisma/client";
import {auth, NORMAL_PROVIDER, signOut} from "@/auth/auth";
import {hashPassword, verifyPassword} from "@/auth/password";
import {changePasswordForm} from "../validator";
import {CHANGE_PASSWORD_COMPLETE_COOKIE, CHANGE_PASSWORD_COMPLETE_MAX_AGE, CHANGE_PASSWORD_COMPLETE_PATH} from "./completeCookie";
import {redirect} from "next/navigation";

interface ChangePasswordActionSuccessRsult {
	success: true;
}

interface ChangePasswordActionFailureResult {
	success: false;
	message: string;
	path?: "currentPassword" | "newPassword";
}

export type ChangePasswordActionResult = ChangePasswordActionSuccessRsult | ChangePasswordActionFailureResult;

export async function changePasswordAction(data: unknown): Promise<ChangePasswordActionResult> {
	/* 클라이언트에서 같은 스키마로 걸렀지만 서버 액션은 직접 호출될 수 있어 다시 검사한다. */
	const check = changePasswordForm.safeParse(data);

	if (!check.success) {
		const {path, message} = check.error.issues[0];

		const realPath: ChangePasswordActionFailureResult["path"] = path.find((pt) => pt === "currentPassword" || pt === "newPassword");

		return {
			success: false,
			message: message,
			path: realPath,
		};
	}

	const {currentPassword, newPassword} = check.data;

	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return {
			success: false,
			message: "로그인이 필요해요. 다시 로그인해 주세요.",
		};
	}

	const userId: string = authInfo.user.id;

	const user = await db.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			password: true,
			accounts: {
				select: {
					provider: true,
				},
				where: {
					provider: NORMAL_PROVIDER,
				},
			},
		},
	});

	if (user === null) {
		return {
			success: false,
			message: "계정을 찾을 수 없어요. 다시 로그인해 주세요.",
		};
	}

	/* 소셜 가입자는 비밀번호가 없다. 설정 화면에서 버튼을 숨기지만 액션은 직접 부를 수 있다. */
	if (user.accounts.length === 0) {
		return {
			success: false,
			message: "소셜 계정은 비밀번호를 바꿀 수 없어요.",
		};
	}

	/* 새 비밀번호가 현재 비밀번호와 같은 경우는 위 스키마 검사(refine)에서 이미 막았다.
	   현재 비밀번호가 맞았다면 새 비밀번호는 그와 다른 문자열이므로 해시와 다시 비교하지 않는다. */
	const matched: boolean = await verifyPassword(currentPassword, user.password);

	if (!matched) {
		return {
			success: false,
			message: "현재 비밀번호가 맞지 않아요. 현재 비밀번호를 올바르게 입력해 주세요.",
			path: "currentPassword",
		};
	}

	const passwordHash: string = await hashPassword(newPassword);

	/* 세션 버전을 올리면 이 계정으로 발급된 모든 세션(JWT)이 다음 요청부터 끊긴다.
	   다른 기기뿐 아니라 지금 비밀번호를 바꾼 브라우저도 포함된다. */
	await db.user.update({
		data: {
			password: passwordHash,
			sessionVersion: {
				increment: 1,
			},
		},
		where: {
			id: userId,
		},
	});

	const cookieStore = await cookies();

	cookieStore.set(CHANGE_PASSWORD_COMPLETE_COOKIE, "1", {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: CHANGE_PASSWORD_COMPLETE_PATH,
		maxAge: CHANGE_PASSWORD_COMPLETE_MAX_AGE,
	});

	/* 세션 버전으로도 끊기지만 쿠키에 남은 낡은 토큰을 바로 지운다. 남겨 두면 요청마다
	   버전을 비교하느라 DB를 읽고 나서야 로그아웃 상태가 된다. */
	await signOut({
		redirect: false,
	});

	redirect("/setting/changepw/complete", "replace");
}
