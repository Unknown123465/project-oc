"use client";

import styles from "./page.module.css";
import {PasswordInput, TextInput} from "@/components/ui/input";
import {SubmitButton} from "@/components/ui/button";
import {useCallback, useId, useSyncExternalStore} from "react";

import {normalLoginAction} from "./action";
import {useForm} from "react-hook-form";
import {LOGIN_UNEXPECTED_ERROR_MESSAGE, loginForm, toLoginQuery, type LoginFormType} from "./validator";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter, useSearchParams} from "next/navigation";
import {useSession} from "next-auth/react";
import {genErrorMessage, removeErrorQuery} from "./errorQuery";

export function LoginForm() {
	const session = useSession();
	const router = useRouter();
	const query = useSearchParams();

	const formId = useId();
	const userNameId = useId();
	const passwordId = useId();
	const errorId = useId();

	const {
		control,
		setError,
		handleSubmit,
		formState: {errors, isSubmitting},
	} = useForm({
		defaultValues: {
			userName: "",
			password: "",
		},
		resolver: zodResolver(loginForm),
		mode: "onSubmit",
	});

	const errQuery: string | null = query.get("error");

	const message: string | undefined = useSyncExternalStore(
		() => () => {},
		() => genErrorMessage(errQuery) ?? errors.userName?.message ?? errors.password?.message ?? errors.root?.message,
		() => undefined
	);

	const onSubmit = useCallback(
		async (data: LoginFormType) => {
			try {
				removeErrorQuery(query, router);

				const queryData = toLoginQuery(query);

				const result = await normalLoginAction(data, queryData);

				if (result.success) {
					session.update();

					router.replace(result.result);
				} else {
					setError("root", {message: result.message});
				}
			} catch {
				setError("root", {
					message: LOGIN_UNEXPECTED_ERROR_MESSAGE,
				});
			}
		},
		[query, router, session, setError]
	);

	const onError = useCallback(() => {
		removeErrorQuery(query, router);
	}, [query, router]);

	return (
		<form className={styles.login_form} id={formId} onSubmit={handleSubmit(onSubmit, onError)} noValidate>
			<TextInput
				id={userNameId}
				name="userName"
				control={control}
				label="사용자 이름"
				placeholder="사용자 이름을 입력하세요"
				autoComplete="username"
				describedBy={errors.userName ? errorId : undefined}
			/>

			<PasswordInput
				id={passwordId}
				name="password"
				control={control}
				label="비밀번호"
				placeholder="비밀번호를 입력하세요"
				autoComplete="current-password"
				describedBy={errors.password ? errorId : undefined}
			/>

			<p id={errorId} className={styles.form_error} role="alert" aria-live="polite">
				{message}
			</p>

			<SubmitButton className={styles.submit_button} disabled={isSubmitting}>
				{isSubmitting ? "확인중" : "로그인"}
			</SubmitButton>
		</form>
	);
}
