"use server";

import "server-only";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import db from "@/prisma/client";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/client";
import {auth} from "@/auth/auth";
import {NORMAL_PROVIDER} from "@/auth/provider";
import {hashPassword, verifyPassword} from "@/auth/password";
import {hashToken, isRawToken, PASSWORD_RESET_TOKEN_TYPE} from "@/auth/verificationToken";
import {renderMailTemplate} from "@/mail/template";
import {sendMail} from "@/mail/mailer";
import {resetPasswordForm} from "@/app/resetpw/validator";
import {RESET_PASSWORD_COMPLETE_COOKIE, RESET_PASSWORD_COMPLETE_MAX_AGE, RESET_PASSWORD_COMPLETE_PATH} from "@/app/resetpw/completeCookie";

/** 성공하면 완료 페이지로 redirect하므로 돌아오는 값은 실패뿐이다. */
interface ResetPasswordResult {
	success: false;
	message: string;
	path?: "newPassword" | "newPasswordRepeat";
}

/* 메일 링크의 화면에서 새 비밀번호를 제출하면 바꾼다. 비밀번호 변경과 달리 현재 비밀번호를 묻지 않는다.
   메일함을 열 수 있다는 것(토큰)이 본인 확인이다. 바꾸고 나면 세션 버전을 올려 모든 기기의 로그인을 끊는다. */
export async function resetPassword(rawToken: unknown, data: unknown): Promise<ResetPasswordResult> {
	if (typeof rawToken !== "string" || !isRawToken(rawToken)) {
		return {
			success: false,
			message: "링크 주소가 올바르지 않아요.",
		};
	}

	const check = resetPasswordForm.safeParse(data);

	if (!check.success) {
		const {path, message} = check.error.issues[0];

		return {
			success: false,
			message,
			path: path.find((pt) => pt === "newPassword" || pt === "newPasswordRepeat"),
		};
	}

	const authInfo = await auth();

	if (authInfo !== null) {
		return {
			success: false,
			message: "로그인한 상태에서는 쓸 수 없어요. 로그아웃한 뒤 링크를 다시 열어 주세요.",
		};
	}

	const tokenHash: string = hashToken(rawToken);
	const passwordHash: string = await hashPassword(check.data.newPassword);

	let user: Record<"email" | "username", string | null>;

	try {
		user = await db.$transaction(async (t) => {
			const request = await t.verificationToken.findUnique({
				where: {
					token: tokenHash,
				},
				select: {
					identifier: true,
					type: true,
					expires: true,
				},
			});

			if (request === null || request.type !== PASSWORD_RESET_TOKEN_TYPE) {
				throw new Error("이미 쓴 링크이거나 없는 링크예요. 비밀번호 재설정을 다시 요청해 주세요.", {cause: true});
			}

			if (request.expires.getTime() <= Date.now()) {
				throw new Error("링크를 쓸 수 있는 시간이 지났어요. 비밀번호 재설정을 다시 요청해 주세요.", {cause: true});
			}

			const target = await t.user.findUnique({
				where: {
					id: request.identifier,
				},
				select: {
					email: true,
					username: true,
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

			if (target === null || target.accounts.length === 0) {
				throw new Error("계정을 찾을 수 없어요. 탈퇴한 계정일 수 있어요.", {cause: true});
			}

			const isSamePassword: boolean = await verifyPassword(check.data.newPassword, target.password);

			if (isSamePassword) {
				throw new Error("비밀번호가 현재 비밀번호랑 일치해요. 다른 비밀번호를 입력해 주세요.", {cause: true});
			}

			await t.user.update({
				data: {
					password: passwordHash,
					sessionVersion: {
						increment: 1,
					},
				},
				where: {
					id: request.identifier,
				},
			});

			/* 같은 링크를 두 번 쓰지 못하게 바로 지운다. 두 요청이 동시에 들어와 이미 지워졌으면
			   P2025로 트랜잭션 전체가 되돌려진다. */
			await t.verificationToken.delete({
				where: {
					token: tokenHash,
				},
			});

			return {
				email: target.email,
				username: target.username,
			};
		});
	} catch (err) {
		if (err instanceof Error && err.cause === true) {
			return {
				success: false,
				message: err.message,
			};
		} else if (err instanceof PrismaClientKnownRequestError && err.code === "P2025") {
			return {
				success: false,
				message: "이미 쓴 링크예요.",
			};
		}

		console.error("비밀번호 재설정 실패", err);

		return {
			success: false,
			message: "비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.",
		};
	}

	/* 메일함을 남이 쓰고 있다면 주인이 알 수 있게 알린다. 비밀번호는 이미 바뀌었으므로
	   알림이 실패해도 결과는 성공으로 둔다. */
	if (user.email !== null) {
		try {
			const origin: string = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

			const html: string = await renderMailTemplate("password-changed", {
				userName: user.username ?? "회원",
				changedAt: new Intl.DateTimeFormat("ko-KR", {dateStyle: "long", timeStyle: "short", timeZone: "Asia/Seoul"}).format(new Date()),
				resetLink: new URL("/resetpw", origin).toString(),
			});

			await sendMail({to: user.email, subject: "[프로젝트 OC] 비밀번호가 바뀌었어요", html});
		} catch (err) {
			console.error("비밀번호 재설정 알림 발송 실패", err);
		}
	}

	const cookieStore = await cookies();

	cookieStore.set(RESET_PASSWORD_COMPLETE_COOKIE, "1", {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: RESET_PASSWORD_COMPLETE_PATH,
		maxAge: RESET_PASSWORD_COMPLETE_MAX_AGE,
	});

	redirect(RESET_PASSWORD_COMPLETE_PATH, "replace");
}
