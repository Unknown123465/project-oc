"use client";

import {useCallback, useId} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "next/navigation";

import styles from "./SignupForm.module.css";
import {PasswordInput, TextInput} from "@/components/ui/input";
import {SubmitButton} from "@/components/ui/button";
import {signupAction} from "@/app/signup/action";
import {signupForm, type SignupFormType} from "@/app/signup/validator";

export default function SignupForm() {
	const router = useRouter();

	const rootErrorId = useId();

	const {
		control,
		setError,
		handleSubmit,
		formState: {errors, isSubmitting},
	} = useForm({
		defaultValues: {
			email: "",
			userName: "",
			password: "",
			passwordRepeat: "",
		},
		resolver: zodResolver(signupForm),
		mode: "onSubmit",
	});

	const onSubmit = useCallback(
		async (data: SignupFormType) => {
			const result = await signupAction(data);

			if (result.success) {
				router.replace("/");
			} else {
				/* 서버에서만 알 수 있는 실패(중복 가입 등)는 필드를 특정할 수 없어
				   root로 받아 비밀번호 확인 아래 한곳에 낸다. */
				setError("root", {message: result.message});
			}
		},
		[router, setError],
	);

	return (
		<form className={styles.signup_form} onSubmit={handleSubmit(onSubmit)} noValidate>
			<TextInput name="email" control={control} label="이메일 주소" placeholder="example@email.com" autoComplete="email" showFieldError required />

			<TextInput name="userName" control={control} label="사용자 이름" placeholder="2~20자로 입력하세요" autoComplete="username" showFieldError required />

			<PasswordInput
				name="password"
				control={control}
				label="비밀번호"
				placeholder="영문과 숫자를 조합해 주세요"
				autoComplete="new-password"
				help="6~20자의 영문과 숫자 조합"
				showFieldError
				required
			/>

			<div className={styles.repeat_field}>
				<PasswordInput
					name="passwordRepeat"
					control={control}
					label="비밀번호 확인"
					placeholder="비밀번호를 다시 입력하세요"
					autoComplete="new-password"
					showFieldError
					required
					describedBy={errors.root ? rootErrorId : undefined}
				/>

				{/* 서버가 되돌려준 실패는 초점이 옮겨 가지 않아 스스로 읽히지 않는다.
				    폼에서 유일하게 live 영역이 필요한 자리다. */}
				<p id={rootErrorId} className={styles.root_error} role="alert" aria-live="polite">
					{errors.root?.message}
				</p>
			</div>

			<SubmitButton className={styles.submit_button} disabled={isSubmitting}>
				{isSubmitting ? "가입중" : "회원가입"}
			</SubmitButton>
		</form>
	);
}
