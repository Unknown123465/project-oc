"use server";

import "server-only";
import {AuthError} from "next-auth";
import {signIn, authProviders} from "../../auth/auth";
import {saveAgeConsent} from "../../auth/ageConsent";
import {loginForm, LoginFormType, providerForm, ProviderFormType, resolveLoginRedirect} from "./validator";

interface NormalLoginActionSuccessResult {
	success: true;
	result: string;
}

interface NormalLoginActionFailureResult {
	success: false;
	message: string;
}
type NormalLoginActionResult = NormalLoginActionSuccessResult | NormalLoginActionFailureResult;

interface SocialLoginActionSuccessResult {
	success: true;
	result: string;
}

interface SocialLoginActionFailureResult {
	success: false;
	message: string;
}

type SocialLoginActionResult = SocialLoginActionSuccessResult | SocialLoginActionFailureResult;

/* 없는 계정과 틀린 비밀번호를 같은 문구로 돌려준다. 둘을 구분해 알려주면
   로그인 폼만으로 어떤 사용자 이름이 가입돼 있는지 확인할 수 있게 된다. */
const NORMAL_LOGIN_FAILED_MESSAGE = "사용자 이름 또는 비밀번호가 올바르지 않습니다.";

const SOCIAL_LOGIN_FAILED_MESSAGE = "소셜 로그인에 실패했어요. 다시 시도해 주세요.";

export async function normalLoginAction(data: LoginFormType, query: Record<string, string> | null): Promise<NormalLoginActionResult> {
	const check = loginForm.safeParse(data);

	if (!check.success) {
		return {
			success: false,
			message: check.error.issues[0].message,
		};
	}

	const loginRedirect = resolveLoginRedirect(query);

	if (!loginRedirect.success) {
		return loginRedirect;
	}

	const {userName, password} = check.data;

	try {
		await signIn(authProviders.Credentials, {
			userName,
			password,
			redirect: false,
			redirectTo: loginRedirect.result,
		});

		return {
			success: true,
			result: loginRedirect.result,
		};
	} catch (err) {
		if (err instanceof AuthError) {
			return {
				success: false,
				message: NORMAL_LOGIN_FAILED_MESSAGE,
			};
		}

		throw err;
	}
}

export async function socialLoginAction(provider: ProviderFormType, query: Record<string, string> | null, ageConfirmed: boolean): Promise<SocialLoginActionResult> {
	const providerCheck = providerForm.safeParse(provider);

	if (!providerCheck.success) {
		return {
			success: false,
			message: providerCheck.error.issues[0].message,
		};
	}

	const loginRedirect = resolveLoginRedirect(query);

	if (!loginRedirect.success) {
		return loginRedirect;
	}

	/* 처음 가입하는 소셜 계정인지는 콜백에서야 알 수 있어, 체크 여부를 쿠키로 콜백까지 넘긴다(auth/ageConsent.ts). */
	await saveAgeConsent(ageConfirmed === true);

	const id = authProviders[provider];

	try {
		const redirectUrl: string = await signIn(id, {
			redirect: false,
			redirectTo: loginRedirect.result,
		});

		return {
			success: true,
			result: redirectUrl,
		};
	} catch (err) {
		if (err instanceof AuthError) {
			return {
				success: false,
				message: SOCIAL_LOGIN_FAILED_MESSAGE,
			};
		}

		throw err;
	}
}
