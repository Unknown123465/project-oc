"use client";

import styles from "./SocialLoginList.module.css";
import loginStyles from "@/app/login/page.module.css";
import {ActionButton} from "@/components/ui/button";
import {socialLoginAction} from "@/app/login/action";
import {useCallback, useId, useState} from "react";
import Link from "next/link";
import {useSearchParams, useRouter} from "next/navigation";
import {LOGIN_UNEXPECTED_ERROR_MESSAGE, toLoginQuery, type ProviderFormType} from "@/app/login/validator";
import {removeErrorQuery} from "@/app/login/errorQuery";

const socialLogins = [
	{provider: "Google", label: "구글로 로그인"},
	{provider: "Naver", label: "네이버로 로그인"},
	{provider: "Twitter", label: "X(트위터)로 로그인"},
	{provider: "Kakao", label: "카카오로 로그인"},
] as const;

export default function SocialLoginList() {
	const router = useRouter();
	const query = useSearchParams();

	const [isLogin, setIsLogin] = useState<boolean>(false);

	const [errorMessage, setErrorMessage] = useState<string>("");

	/* 처음 가입하는 소셜 계정만 이 값을 본다. 이미 가입한 사람은 체크하지 않아도 로그인된다. */
	const [ageConfirmed, setAgeConfirmed] = useState<boolean>(false);

	const ageCheckId = useId();
	const ageNoteId = useId();

	const loginStart = useCallback(
		async (provider: ProviderFormType) => {
			try {
				removeErrorQuery(query, router);

				setErrorMessage("");
				setIsLogin(true);

				const queryData = toLoginQuery(query);

				const result = await socialLoginAction(provider, queryData, ageConfirmed);

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
		[query, router, ageConfirmed]
	);

	return (
		<div className={styles.social}>
			<label htmlFor={ageCheckId} className={styles.age_check}>
				<input id={ageCheckId} type="checkbox" checked={ageConfirmed} onChange={(event) => setAgeConfirmed(event.target.checked)} aria-describedby={ageNoteId} disabled={isLogin} />
				만 15세 이상이에요
			</label>

			{socialLogins.map(({provider, label}) => (
				<ActionButton key={provider} disabled={isLogin} onClick={() => loginStart(provider)} styleType="normal">
					{label}
				</ActionButton>
			))}

			<p id={ageNoteId} className={styles.age_note}>
				소셜 계정으로 처음 로그인하면 바로 회원가입이 돼요. 이때는 위의 만 15세 이상 칸을 체크해 주세요. 만 15세 미만은 가입할 수 없어요.
			</p>

			{/* 소셜 가입은 가입 폼을 거치지 않아 동의 안내를 여기에 둔다. 로그인 화면을 벗어나지 않도록 새 창으로 연다. */}
			<p className={styles.age_note}>
				처음 로그인해 가입하면 프로젝트 OC의{" "}
				<Link href="/termsofuse" target="_blank" rel="noreferrer noopener">
					이용 정책
				</Link>
				과{" "}
				<Link href="/privacy" target="_blank" rel="noreferrer noopener">
					개인정보 처리방침
				</Link>
				에 동의하게 됩니다.
			</p>

			<p className={loginStyles.form_error} role="alert" aria-live="polite">
				{errorMessage}
			</p>
		</div>
	);
}
