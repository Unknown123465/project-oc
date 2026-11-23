import type {ReadonlyURLSearchParams, useRouter} from "next/navigation";
import {LOGIN_UNEXPECTED_ERROR_MESSAGE} from "./validator";

export const OAUTH_CALLBACK_ERROR_MESSAGE = "소셜 로그인이 완료되지 않았어요. 다시 시도하거나 다른 방법으로 로그인해 주세요." as const;

export const OAUTH_ACCOUNT_NOT_LINKED_MESSAGE = "이미 다른 방법으로 가입된 이메일이에요. 처음 가입한 방법으로 로그인해 주세요." as const;
export const ACCESS_DENIED_MESSAGE = "이 계정으로는 로그인할 수 없어요. 계정 상태를 확인한 뒤 다시 시도해 주세요." as const;

/* 소셜 계정으로 처음 가입하면서 만 15세 이상 체크를 하지 않았을 때 auth.ts의 signIn 콜백이 붙이는 값 */
export const AGE_CONSENT_REQUIRED_ERROR = "AgeConsentRequired" as const;
export const AGE_CONSENT_REQUIRED_MESSAGE = "처음 가입할 때는 만 15세 이상인지 확인해야 해요. 아래 칸을 체크한 뒤 다시 로그인해 주세요." as const;

export function genErrorMessage(error: string | null): string | null {
	switch (error) {
		case null:
		case "":
			return null;

		case "OAuthCallbackError":
			return OAUTH_CALLBACK_ERROR_MESSAGE;

		case "OAuthAccountNotLinked":
			return OAUTH_ACCOUNT_NOT_LINKED_MESSAGE;

		case "AccessDenied":
			return ACCESS_DENIED_MESSAGE;

		case AGE_CONSENT_REQUIRED_ERROR:
			return AGE_CONSENT_REQUIRED_MESSAGE;

		default:
			return LOGIN_UNEXPECTED_ERROR_MESSAGE;
	}
}

export function removeErrorQuery(query: ReadonlyURLSearchParams, router: ReturnType<typeof useRouter>): void {
	if (query.get("error") !== null) {
		const searchParams: URLSearchParams = new URLSearchParams(query);

		searchParams.delete("error");

		const queryString: string = searchParams.size > 0 ? "?" + searchParams.toString() : "";

		router.replace(location.pathname + queryString);
	}
}
