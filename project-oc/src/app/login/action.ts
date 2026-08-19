"use server";

import "server-only";
import {signIn, authProviders} from "../../auth/auth";
import {loginForm, LoginFormType} from "./validator";

export async function normalLoginAction(data: LoginFormType) {
	const check = loginForm.safeParse(data);

	if (!check.success) {
		return {
			success: false,
			message: check.error.issues[0].message,
		};
	}

	const test: number = Math.random();

	if (test > 1) {
		return {
			success: true,
		};
	} else {
		return {
			success: false,
			message: Math.random().toString(),
		};
	}
}

export async function googleLoginAction() {
	const id = authProviders.Google;

	await signIn(id, {
		redirectTo: "/",
	});
}

export async function naverLoginAction() {
	const id = authProviders.Naver;

	await signIn(id, {
		redirectTo: "/",
	});
}

export async function kakaoLoginAction() {
	const id = authProviders.Kakao;

	await signIn(id, {
		redirectTo: "/",
	});
}

export async function twitterLoginAction() {
	const id = authProviders.Twitter;

	await signIn(id, {
		redirectTo: "/",
	});
}
