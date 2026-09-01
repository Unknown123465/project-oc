"use client";

import styles from "./page.module.css";
import {PasswordInput, TextInput} from "@/components/ui/input";
import {SubmitButton} from "@/components/ui/button";
import {useCallback, useId} from "react";

import {normalLoginAction} from "./action";
import {useForm} from "react-hook-form";
import {loginForm, type LoginFormType} from "./validator";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "next/navigation";

export function LoginForm() {
	const router = useRouter();

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

	const onSubmit = useCallback(
		async (data: LoginFormType) => {
			const result = await normalLoginAction(data);

			if (result.success) {
				router.replace("/");
			} else {
				setError("root", {message: result.message});
			}
		},
		[router, setError],
	);

	const message: string | undefined = errors.userName?.message ?? errors.password?.message ?? errors.root?.message;

	return (
		<form className={styles.login_form} id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
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
