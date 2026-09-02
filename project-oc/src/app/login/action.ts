"use server";

import "server-only";
import {AuthError} from "next-auth";
import {signIn, authProviders} from "../../auth/auth";
import {loginForm, LoginFormType} from "./validator";

type LoginActionResult = {success: true} | {success: false; message: string};

/* 없는 계정과 틀린 비밀번호를 같은 문구로 돌려준다. 둘을 구분해 알려주면
   로그인 폼만으로 어떤 사용자 이름이 가입돼 있는지 확인할 수 있게 된다. */
const LOGIN_FAILED_MESSAGE = "사용자 이름 또는 비밀번호가 올바르지 않습니다.";

export async function normalLoginAction(data: LoginFormType): Promise<LoginActionResult> {
	const check = loginForm.safeParse(data);

	if (!check.success) {
		return {
			success: false,
			message: check.error.issues[0].message,
		};
	}

	const {userName, password} = check.data;

	try {
		/* redirect: false여야 서버 액션이 NEXT_REDIRECT를 던지지 않고
		   결과를 돌려줄 수 있다. 세션 쿠키는 그래도 설정된다. */
		await signIn(authProviders.Credentials, {userName, password, redirect: false});
	} catch (error) {
		if (error instanceof AuthError) {
			return {
				success: false,
				message: LOGIN_FAILED_MESSAGE,
			};
		}

		throw error;
	}

	return {
		success: true,
	};
}

export async function googleLoginAction(): Promise<void> {
	const id = authProviders.Google;

	await signIn(id, {
		redirectTo: "/",
	});
}

export async function naverLoginAction(): Promise<void> {
	const id = authProviders.Naver;

	await signIn(id, {
		redirectTo: "/",
	});
}

export async function kakaoLoginAction(): Promise<void> {
	const id = authProviders.Kakao;

	await signIn(id, {
		redirectTo: "/",
	});
}

export async function twitterLoginAction(): Promise<void> {
	const id = authProviders.Twitter;

	await signIn(id, {
		redirectTo: "/",
	});
}
