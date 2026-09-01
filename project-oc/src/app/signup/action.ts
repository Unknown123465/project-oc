"use server";

import "server-only";
import {AuthError} from "next-auth";
import db from "@/prisma/client";
import {authProviders, NORMAL_PROVIDER, signIn} from "@/auth/auth";
import {hashPassword} from "@/auth/password";
import {signupForm, type SignupFormType} from "./validator";

export type SignupActionResult = {success: true} | {success: false; message: string};

export async function signupAction(data: SignupFormType): Promise<SignupActionResult> {
	/* 클라이언트에서 이미 같은 스키마로 걸렀지만 서버 액션은 직접 호출될 수 있다.
	   여기가 신뢰 경계이므로 다시 검사한다. */
	const check = signupForm.safeParse(data);

	if (!check.success) {
		return {success: false, message: check.error.issues[0].message};
	}

	const {email, userName, password} = check.data;

	const [emailOwner, userNameOwner] = await Promise.all([
		db.user.findUnique({where: {email}, select: {id: true}}),
		db.user.findUnique({where: {username: userName}, select: {id: true}}),
	]);

	if (emailOwner !== null) {
		return {success: false, message: "이미 가입된 이메일 주소입니다."};
	}

	if (userNameOwner !== null) {
		return {success: false, message: "이미 사용 중인 사용자 이름입니다."};
	}

	const passwordHash = await hashPassword(password);

	/* User와 Account를 한 트랜잭션으로 묶는다. Account만 없는 User가 남으면
	   가입은 됐는데 어느 경로로 만든 계정인지 알 수 없는 행이 된다. */
	await db.$transaction(async (tx) => {
		const user = await tx.user.create({
			data: {
				name: userName,
				username: userName,
				email,
				password: passwordHash,
				image: null,
			},
			select: {id: true},
		});

		await tx.account.create({
			data: {
				userId: user.id,
				type: "credentials",
				provider: NORMAL_PROVIDER,
				providerAccountId: user.id,
			},
		});
	});

	/* 가입 직후 바로 로그인 상태로 만든다. redirect: false여야 이 액션이
	   NEXT_REDIRECT를 던지지 않고 결과를 돌려줄 수 있다. 쿠키는 그래도 설정된다. */
	try {
		await signIn(authProviders.Credentials, {userName, password, redirect: false});
	} catch (error) {
		if (error instanceof AuthError) {
			/* 계정은 이미 만들어졌으므로 가입 자체를 실패로 되돌리지 않는다. */
			return {success: false, message: "가입은 되었지만 자동 로그인에 실패했습니다. 로그인 페이지에서 로그인해 주세요."};
		}

		throw error;
	}

	return {success: true};
}
