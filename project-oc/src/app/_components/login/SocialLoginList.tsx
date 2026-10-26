"use client";

import styles from "./SocialLoginList.module.css";
import loginStyles from "@/app/login/page.module.css";
import {ActionButton} from "@/components/ui/button";
import {socialLoginAction} from "@/app/login/action";
import {useCallback, useState} from "react";
import {useSearchParams} from "next/navigation";
import {LOGIN_UNEXPECTED_ERROR_MESSAGE, toLoginQuery, type ProviderFormType} from "@/app/login/validator";

const socialLogins = [
	{provider: "Google", label: "구글로 로그인"},
	{provider: "Naver", label: "네이버로 로그인"},
	{provider: "Twitter", label: "X(트위터)로 로그인"},
	{provider: "Kakao", label: "카카오로 로그인"},
] as const;

export default function SocialLoginList() {
	const query = useSearchParams();

	const [isLogin, setIsLogin] = useState<boolean>(false);

	const [errorMessage, setErrorMessage] = useState<string>("");

	const loginStart = useCallback(
		async (provider: ProviderFormType) => {
			try {
				setErrorMessage("");
				setIsLogin(true);

				const queryData = toLoginQuery(query);

				const result = await socialLoginAction(provider, queryData);

				if (result.success) {
					location.replace(result.result);
				} else {
					setErrorMessage(result.message);
					setIsLogin(false);
				}
			} catch {
				setErrorMessage(LOGIN_UNEXPECTED_ERROR_MESSAGE);
				setIsLogin(false);
			}
		},
		[query]
	);

	return (
		<div className={styles.social}>
			{socialLogins.map(({provider, label}) => (
				<ActionButton key={provider} disabled={isLogin} onClick={() => loginStart(provider)} styleType="normal">
					{label}
				</ActionButton>
			))}

			<p className={loginStyles.form_error} role="alert" aria-live="polite">
				{errorMessage}
			</p>
		</div>
	);
}
