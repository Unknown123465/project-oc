"use server";

import db from "@/prisma/client";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/client";
import {EMAIL_CHANGE_TOKEN_TYPE, hashToken, isRawToken} from "@/auth/verificationToken";
import {renderMailTemplate} from "@/mail/template";
import {sendMail} from "@/mail/mailer";

interface ConfirmEmailChangeSuccessResult {
	success: true;
	newEmail: string;
}

interface ConfirmEmailChangeFailureResult {
	success: false;
	message: string;
}

type ConfirmEmailChangeResult = ConfirmEmailChangeSuccessResult | ConfirmEmailChangeFailureResult;

/* 확인 화면의 버튼을 눌렀을 때만 이메일을 바꾼다. 링크를 연 것만으로 바꾸면 메일 보안 검사기가
   링크를 미리 열어 보는 순간 사용자가 누르지도 않았는데 바뀐다.

   링크를 연 브라우저가 로그인하지 않았어도 바꾼다. 새 메일함이 열린 기기와 이
   사이트에 로그인한 기기가 다른 경우가 많아서다. 토큰은 실패해도 쓰지 않는다. 만료되거나
   성공했을 때만 사라진다. */
export async function confirmEmailChange(rawToken: unknown): Promise<ConfirmEmailChangeResult> {
	if (typeof rawToken !== "string" || !isRawToken(rawToken)) {
		return {
			success: false,
			message: "링크 주소가 올바르지 않아요.",
		};
	}

	const tokenHash: string = hashToken(rawToken);

	const request = await db.verificationToken.findUnique({
		where: {
			token: tokenHash,
		},
		select: {
			identifier: true,
			type: true,
			newEmail: true,
			expires: true,
		},
	});

	if (request === null || request.type !== EMAIL_CHANGE_TOKEN_TYPE || request.newEmail === null) {
		return {
			success: false,
			message: "이미 쓴 링크이거나 없는 링크예요. 계정 설정에서 다시 요청해 주세요.",
		};
	}

	if (request.expires.getTime() <= Date.now()) {
		return {
			success: false,
			message: "링크를 쓸 수 있는 시간이 지났어요. 계정 설정에서 다시 요청해 주세요.",
		};
	}

	const userId: string = request.identifier;
	const newEmail: string = request.newEmail;

	let previous: Record<"email" | "username", string | null> | null;

	try {
		previous = await db.$transaction(async (t) => {
			const user = await t.user.findUnique({
				where: {
					id: userId,
				},
				select: {
					email: true,
					username: true,
				},
			});

			if (user === null) {
				return null;
			}

			await t.user.update({
				data: {
					email: newEmail,
				},
				where: {
					id: userId,
				},
			});

			/* 같은 링크를 두 번 쓰지 못하게 바꾼 뒤 바로 지운다. 두 요청이 동시에 들어와
			   이미 지워졌으면 P2025로 트랜잭션 전체가 되돌려진다. */
			await t.verificationToken.delete({
				where: {
					token: tokenHash,
				},
			});

			return user;
		});
	} catch (err) {
		if (err instanceof PrismaClientKnownRequestError) {
			/* 요청한 뒤 확인하기 전에 다른 계정이 이 주소로 가입하거나 바꿨다. */
			if (err.code === "P2002") {
				return {
					success: false,
					message: "그사이 다른 계정이 이 이메일을 쓰게 됐어요. 다른 주소로 다시 요청해 주세요.",
				};
			}

			if (err.code === "P2025") {
				return {
					success: false,
					message: "이미 쓴 링크예요.",
				};
			}
		}

		console.error("이메일 변경 실패", err);

		return {
			success: false,
			message: "이메일을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.",
		};
	}

	if (previous === null) {
		return {
			success: false,
			message: "계정을 찾을 수 없어요. 탈퇴한 계정일 수 있어요.",
		};
	}

	/* 세션을 뺏긴 상태에서 누군가 이메일을 바꿨을 수도 있어 원래 주소로 알린다.
	   이메일은 이미 바뀌었으므로 알림이 실패해도 결과는 성공으로 둔다. */
	if (previous.email !== null) {
		try {
			const origin: string = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

			const html: string = await renderMailTemplate("email-changed", {
				userName: previous.username ?? "회원",
				newEmail,
				changedAt: new Intl.DateTimeFormat("ko-KR", {dateStyle: "long", timeStyle: "short", timeZone: "Asia/Seoul"}).format(new Date()),
				loginLink: new URL("/login", origin).toString(),
			});

			await sendMail({to: previous.email, subject: "[프로젝트 OC] 계정 이메일이 바뀌었어요", html});
		} catch (err) {
			console.error("이메일 변경 알림 발송 실패", {userId, err});
		}
	}

	return {
		success: true,
		newEmail,
	};
}
