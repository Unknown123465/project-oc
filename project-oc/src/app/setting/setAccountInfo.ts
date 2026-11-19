"use server";

import {auth} from "@/auth/auth";
import db from "@/prisma/client";
import {changeEmailForm, changeUserNameForm, SAME_USER_NAME_MESSAGE, setAutoplayMusicForm} from "./validator";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/client";
import {NORMAL_PROVIDER} from "@/auth/auth";
import {createRawToken, EMAIL_CHANGE_TOKEN_MINUTES, EMAIL_CHANGE_TOKEN_TYPE, hashToken} from "@/auth/verificationToken";
import {renderMailTemplate} from "@/mail/template";
import {sendMail} from "@/mail/mailer";

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

export async function changeUserName(data: unknown): Promise<SetAccountInfoResult<string>> {
	const check = changeUserNameForm.safeParse(data);

	if (!check.success) {
		return {
			success: false,
			message: check.error.issues[0].message,
			requireRefresh: false,
		};
	}

	const {userName} = check.data;

	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return {
			success: false,
			message: "로그인이 필요해요. 다시 로그인해 주세요.",
			requireRefresh: false,
		};
	}

	const userId: string = authInfo.user.id;

	const owner = await db.user.findUnique({
		where: {username: userName},
		select: {id: true, username: true},
	});

	/* 화면에서 먼저 막지만 액션은 직접 부를 수 있어 여기서도 확인한다.
	   DB 비교는 대소문자를 가리지 않아 "hong"을 "Hong"으로 바꾸면 자기 행이 찾아진다.
	   글자가 완전히 같을 때만 같은 이름으로 보고, 대소문자만 다르면 그대로 바꾼다. */
	if (owner?.id === userId && owner.username === userName) {
		return {
			success: false,
			message: SAME_USER_NAME_MESSAGE,
			requireRefresh: false,
		};
	}

	if (owner !== null && owner.id !== userId) {
		return {
			success: false,
			message: "이미 다른 사람이 쓰고 있는 이름이에요.",
			requireRefresh: false,
		};
	}

	try {
		const updateResult = await db.user.update({
			data: {
				username: userName,
			},
			where: {
				id: userId,
			},
			select: {
				username: true,
			},
		});

		return {
			success: true,
			result: updateResult.username ?? userName,
		};
	} catch (err) {
		if (err instanceof PrismaClientKnownRequestError) {
			/* 위에서 확인한 뒤 바꾸기 전에 다른 사람이 같은 이름을 가져가면 유니크 제약에 걸린다. */
			if (err.code === "P2002") {
				return {
					success: false,
					message: "이미 다른 사람이 쓰고 있는 이름이에요.",
					requireRefresh: false,
				};
			}

			if (err.code === "P2025") {
				return {
					success: false,
					message: "계정을 찾을 수 없어요. 다시 로그인해 주세요.",
					requireRefresh: false,
				};
			}
		}

		console.error(err);

		return {
			success: false,
			message: "사용자 이름을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.",
			requireRefresh: false,
		};
	}
}

/* 새 이메일 주소로 확인 링크를 보낸다. 이메일은 링크의 버튼을 눌러야 바뀐다(/auth/[token]).
   유효한 링크가 남아 있는 동안에는 다시 보내지 않는다. 새로고침을 반복해 Gmail의 하루 발송
   한도를 갉아먹는 걸 막으려는 것이다. 성공하면 메일을 보낸 주소를 돌려준다. */
export async function requestEmailChange(data: unknown): Promise<SetAccountInfoResult<string>> {
	const check = changeEmailForm.safeParse(data);

	if (!check.success) {
		return {
			success: false,
			message: check.error.issues[0].message,
			requireRefresh: false,
		};
	}

	const {email} = check.data;

	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return {
			success: false,
			message: "로그인이 필요해요. 다시 로그인해 주세요.",
			requireRefresh: false,
		};
	}

	const userId: string = authInfo.user.id;

	const [account, emailOwner, pending] = await Promise.all([
		db.account.findUnique({
			where: {userId},
			select: {provider: true, user: {select: {email: true, username: true}}},
		}),
		db.user.findUnique({
			where: {email},
			select: {id: true},
		}),
		db.verificationToken.findUnique({
			where: {identifier_type: {identifier: userId, type: EMAIL_CHANGE_TOKEN_TYPE}},
			select: {expires: true},
		}),
	]);

	if (account === null || account.user === null) {
		return {
			success: false,
			message: "계정을 찾을 수 없어요. 다시 로그인해 주세요.",
			requireRefresh: false,
		};
	}

	/* 소셜 계정의 이메일은 그 서비스가 정한 값이라 여기서 바꾸지 않는다. */
	if (account.provider !== NORMAL_PROVIDER) {
		return {
			success: false,
			message: "소셜 계정은 이메일을 바꿀 수 없어요. 다른 이메일로 입력해 주세요.",
			requireRefresh: false,
		};
	}

	if (account.user.email === email) {
		return {
			success: false,
			message: "지금 쓰고 있는 이메일이에요. 다른 이메일로 입력해 주세요.",
			requireRefresh: false,
		};
	}

	if (emailOwner !== null) {
		return {
			success: false,
			message: "이미 가입된 이메일이에요. 다른 이메일로 입력해 주세요.",
			requireRefresh: false,
		};
	}

	const now: number = Date.now();

	if (pending !== null && pending.expires.getTime() > now) {
		const totalSeconds: number = Math.ceil((pending.expires.getTime() - now) / 1000);

		const waitMinutes: number = Math.floor(totalSeconds / 60);
		const waitSeconds: number = totalSeconds % 60;

		const waitTimes: string[] = [waitMinutes > 0 ? `${waitMinutes}분` : null, `${waitSeconds}초`].filter((value) => value !== null);

		return {
			success: false,
			message: `이미 보낸 확인 메일이 있어요. ${waitTimes.join(" ")} 뒤에 다시 요청해 주세요.`,
			requireRefresh: false,
		};
	}

	const rawToken: string = createRawToken();

	try {
		/* (identifier, type)이 유니크라 만료된 예전 요청이 남아 있으면 그 행을 새 값으로 덮는다. */
		await db.verificationToken.upsert({
			where: {identifier_type: {identifier: userId, type: EMAIL_CHANGE_TOKEN_TYPE}},
			create: {
				identifier: userId,
				type: EMAIL_CHANGE_TOKEN_TYPE,
				token: hashToken(rawToken),
				newEmail: email,
				expires: new Date(now + EMAIL_CHANGE_TOKEN_MINUTES * 60 * 1000),
			},
			update: {
				token: hashToken(rawToken),
				newEmail: email,
				expires: new Date(now + EMAIL_CHANGE_TOKEN_MINUTES * 60 * 1000),
			},
		});
	} catch (err) {
		console.error("이메일 변경 토큰 저장 실패", err);

		return {
			success: false,
			message: "확인 메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.",
			requireRefresh: false,
		};
	}

	try {
		const origin: string = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

		const html: string = await renderMailTemplate("email-change", {
			userName: account.user.username ?? "회원",
			newEmail: email,
			link: new URL(`/auth/${rawToken}`, origin).toString(),
			expiresMinutes: EMAIL_CHANGE_TOKEN_MINUTES.toString(),
		});

		await sendMail({to: email, subject: "[프로젝트 OC] 이메일 변경 확인", html});
	} catch (err) {
		console.error("이메일 변경 확인 메일 발송 실패", err);

		/* 메일이 안 나갔는데 토큰이 남으면 5분 동안 다시 요청할 수 없게 된다. */
		await db.verificationToken.deleteMany({where: {identifier: userId, type: EMAIL_CHANGE_TOKEN_TYPE}}).catch((deleteErr) => console.error("이메일 변경 토큰 정리 실패", deleteErr));

		return {
			success: false,
			message: "확인 메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.",
			requireRefresh: false,
		};
	}

	return {
		success: true,
		result: email,
	};
}
