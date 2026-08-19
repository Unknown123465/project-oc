"use client";

import styles from "./page.module.css";
import {PasswordInput, TextInput} from "../component/form/input";
import {SubmitButton} from "../component/form/button";
import {useCallback} from "react";

import {normalLoginAction} from "./action";
import {useForm} from "react-hook-form";
import {loginForm, type LoginFormType} from "./validator";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "next/navigation";

export function LoginForm() {
	const router = useRouter();

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

	return (
		<>
			<form className={styles.login_form} onSubmit={handleSubmit(onSubmit)}>
				<p className={styles.title}>사용자 이름</p>

				<TextInput name="userName" control={control} placeholder="사용자 이름을 입력하세요" />

				<p className={styles.title}>사용자 비밀번호</p>

				<PasswordInput name="password" control={control} placeholder="비밀번호를 입력하세요" />

				<p className={styles.error}>{errors.userName?.message ?? errors.password?.message ?? errors.root?.message}</p>

				<SubmitButton width="100%" className={styles.submit_button} disabled={isSubmitting}>
					{isSubmitting ? "확인중" : "로그인"}
				</SubmitButton>
			</form>
		</>
	);
}
