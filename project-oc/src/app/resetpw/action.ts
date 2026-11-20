"use server";

import "server-only";
import db from "@/prisma/client";
import {auth} from "@/auth/auth";
import {NORMAL_PROVIDER} from "@/auth/provider";
import {createRawToken, formatWaitTime, hashToken, PASSWORD_RESET_TOKEN_MINUTES, PASSWORD_RESET_TOKEN_TYPE} from "@/auth/verificationToken";
import {renderMailTemplate} from "@/mail/template";
import {sendMail} from "@/mail/mailer";
import {requestPasswordResetForm} from "./validator";

interface RequestPasswordResetSuccessResult {
	success: true;
	email: string;
}

interface RequestPasswordResetFailureResult {
	success: false;
	message: string;
}

export type RequestPasswordResetResult = RequestPasswordResetSuccessResult | RequestPasswordResetFailureResult;

/* 이메일과 사용자 이름이 같은 계정에 비밀번호 재설정 링크를 보낸다. 로그인하지 않은 사람이 부르는
   액션이라, 한 계정에 메일이 몰리지 않도록 링크를 쓸 수 있는 동안에는 다시 보내지 않는다. */
export async function requestPasswordReset(data: unknown): Promise<RequestPasswordResetResult> {
	const check = requestPasswordResetForm.safeParse(data);

	if (!check.success) {
		return {
			success: false,
			message: check.error.issues[0].message,
		};
	}

	const {email, userName} = check.data;

	const authInfo = await auth();

	if (authInfo !== null) {
		return {
			success: false,
			message: "로그인한 상태에서는 쓸 수 없어요. 계정 설정에서 비밀번호를 바꿔 주세요.",
		};
	}

	const user = await db.user.findUnique({
		where: {
			email,
		},
		select: {
			id: true,
			username: true,
			accounts: {
				select: {
					provider: true,
				},
			},
		},
	});

	if (user === null || user.username !== userName) {
		return {
			success: false,
			message: "이메일 주소와 사용자 이름이 맞는 계정이 없어요. 다시 확인해 주세요.",
		};
	}

	/* 소셜 가입자는 비밀번호가 없다. 여기서 비밀번호를 만들어 주면 사용자 이름 로그인이 새로 열린다. */
	if (!user.accounts.some((account) => account.provider === NORMAL_PROVIDER)) {
		return {
			success: false,
			message: "소셜 로그인으로 가입한 계정이에요. 가입할 때 쓴 소셜 로그인으로 들어와 주세요.",
		};
	}

	const now: number = Date.now();

	const pending = await db.verificationToken.findUnique({
		where: {
			identifier_type: {
				identifier: user.id,
				type: PASSWORD_RESET_TOKEN_TYPE,
			},
		},
		select: {
			expires: true,
		},
	});

	if (pending !== null && pending.expires.getTime() > now) {
		return {
			success: false,
			message: `이미 보낸 인증 메일이 있어요. ${formatWaitTime(pending.expires, now)} 뒤에 다시 요청해 주세요.`,
		};
	}

	const rawToken: string = createRawToken();
	const expires: Date = new Date(now + PASSWORD_RESET_TOKEN_MINUTES * 60 * 1000);
	const hashedToken: string = hashToken(rawToken);

	try {
		/* (identifier, type)이 유니크라 만료된 예전 요청이 남아 있으면 그 행을 새 값으로 덮는다. */
		await db.verificationToken.upsert({
			where: {
				identifier_type: {
					identifier: user.id,
					type: PASSWORD_RESET_TOKEN_TYPE,
				},
			},
			create: {
				identifier: user.id,
				type: PASSWORD_RESET_TOKEN_TYPE,
				token: hashedToken,
				expires,
			},
			update: {
				token: hashedToken,
				expires,
			},
		});
	} catch (err) {
		console.error("비밀번호 재설정 토큰 저장 실패", err);

		return {
			success: false,
			message: "메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.",
		};
	}

	try {
		const origin: string = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
		const html: string = await renderMailTemplate("password-reset", {
			userName,
			link: new URL(`/auth/resetpw/${rawToken}`, origin).toString(),
			expiresMinutes: PASSWORD_RESET_TOKEN_MINUTES.toString(),
		});

		await sendMail({to: email, subject: "[프로젝트 OC] 비밀번호 재설정", html});

		return {
			success: true,
			email,
		};
	} catch (err) {
		console.error("비밀번호 재설정 메일 발송 실패", err);

		/* 메일이 안 나갔는데 토큰이 남으면 5분 동안 다시 요청할 수 없게 된다. */
		await db.verificationToken
			.deleteMany({
				where: {
					identifier: user.id,
					type: PASSWORD_RESET_TOKEN_TYPE,
				},
			})
			.catch((error) => console.error("비밀번호 재설정 토큰 정리 실패", error));

		return {
			success: false,
			message: "메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.",
		};
	}
}
