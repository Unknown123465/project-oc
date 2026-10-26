import {describe, expect, it} from "vitest";
import {ACCESS_DENIED_MESSAGE, genErrorMessage, OAUTH_ACCOUNT_NOT_LINKED_MESSAGE, OAUTH_CALLBACK_ERROR_MESSAGE} from "./errorQuery";
import {LOGIN_UNEXPECTED_ERROR_MESSAGE} from "./validator";

function getErrorQuery(queryString: string): string | null {
	const searchParams: URLSearchParams = new URLSearchParams(queryString);

	return searchParams.get("error");
}

describe("error 쿼리 문구", () => {
	it.each([
		{value: "", label: "error 쿼리가 없으면"},
		{value: "?error=", label: "error 쿼리의 값이 비어 있으면"},
	] as const)("$label null을 반환해야 한다", ({value}) => {
		const error = getErrorQuery(value);
		const result = genErrorMessage(error);

		expect(result).toBeNull();
	});

	it.each([
		{value: "?error=OAuthCallbackError", label: "'OAuthCallbackError'면", messageLabel: "다시 시도를 권하는 안내를", toBeResult: OAUTH_CALLBACK_ERROR_MESSAGE},
		{value: "?error=OAuthAccountNotLinked", label: "'OAuthAccountNotLinked'면", messageLabel: "처음 가입한 방법을 권하는 안내를", toBeResult: OAUTH_ACCOUNT_NOT_LINKED_MESSAGE},
		{value: "?error=AccessDenied", label: "'AccessDenied'면", messageLabel: "계정 상태를 확인하라는 안내를", toBeResult: ACCESS_DENIED_MESSAGE},
	] as const)("error 쿼리가 $label $messageLabel 반환해야 한다", ({value, toBeResult}) => {
		const error = getErrorQuery(value);
		const result = genErrorMessage(error);

		expect(result).toBe(toBeResult);
	});

	it.each([
		{value: "?error=Configuration", label: "'Configuration'이면"},
		{value: "?error=any-word", label: "목록에 없는 값이면"},
		{value: "?error=constructor", label: "객체 기본 속성 이름인 'constructor'여도"},
		{value: "?error=toString", label: "객체 기본 속성 이름인 'toString'이어도"},
	] as const)("error 쿼리가 $label LOGIN_UNEXPECTED_ERROR_MESSAGE를 반환해야 한다", ({value}) => {
		const error = getErrorQuery(value);
		const result = genErrorMessage(error);

		expect(result).toBe(LOGIN_UNEXPECTED_ERROR_MESSAGE);
	});

	it.each([
		{value: "?error=accessdenied", label: "'accessdenied'여도"},
		{value: "?error=OAUTHCALLBACKERROR", label: "'OAUTHCALLBACKERROR'여도"},
	] as const)("error 쿼리가 대소문자만 다른 $label LOGIN_UNEXPECTED_ERROR_MESSAGE를 반환해야 한다", ({value}) => {
		const error = getErrorQuery(value);
		const result = genErrorMessage(error);

		expect(result).toBe(LOGIN_UNEXPECTED_ERROR_MESSAGE);
	});
});
