"use client";

import styles from "./page.module.css";
import {PasswordInput, TextInput} from "@/components/ui/input";
import {SubmitButton} from "@/components/ui/button";
import {useCallback, useId, useSyncExternalStore, useTransition} from "react";

import {normalLoginAction} from "./action";
import {useForm} from "react-hook-form";
import {LOGIN_UNEXPECTED_ERROR_MESSAGE, loginForm, toLoginQuery, type LoginFormType} from "./validator";
import {zodResolver} from "@hookform/resolvers/zod";
import {unstable_rethrow, useRouter, useSearchParams} from "next/navigation";
import {useSession} from "next-auth/react";
import {genErrorMessage, removeErrorQuery} from "./errorQuery";

export function LoginForm() {
	const session = useSession();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
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
			startTransition(async () => {
				try {
					removeErrorQuery(query, router);

					const queryData = toLoginQuery(query);

					const result = await normalLoginAction(data, queryData);

					if (!result.success) {
						throw new Error(result.message, {cause: true});
					}
				} catch (err) {
					try {
						unstable_rethrow(err);
					} catch (redirectSignal) {
						/* 로그인이 끝나 서버가 redirect했다. 헤더가 쓰는 세션만 다시 읽는다. */
						await session.update();

						throw redirectSignal;
					}

					startTransition(() => {
						setError("root", {
							message: err instanceof Error && err.cause === true ? err.message : LOGIN_UNEXPECTED_ERROR_MESSAGE,
						});
					});
				}
			});
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

			<SubmitButton className={styles.submit_button} disabled={isSubmitting || isPending}>
				{isSubmitting || isPending ? "확인 중" : "로그인"}
			</SubmitButton>
		</form>
	);
}
