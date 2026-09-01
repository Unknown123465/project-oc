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

	const baseId = useId();

	/* 안내와 오류 문구는 폼이 직접 그린다. 입력 컴포넌트는 값과 라벨만 맡고
	   무엇을 어디에 낼지는 이 폼의 몫이다. */
	const errorId = {
		email: `${baseId}-email-error`,
		userName: `${baseId}-user-name-error`,
		password: `${baseId}-password-error`,
		passwordRepeat: `${baseId}-password-repeat-error`,
		root: `${baseId}-root-error`,
	};

	const passwordHelpId = `${baseId}-password-help`;

	/** 입력이 가리킬 설명 요소가 여럿일 때 aria-describedby 한 줄로 잇는다. */
	const describedBy = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(" ") || undefined;

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
				//TODO: 내 캐릭터 페이지 완성 시 해당 페이지로 리다이렉트 되게 구현 할 예정
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
			<div className={styles.field_group}>
				<TextInput name="email" control={control} label="이메일 주소" placeholder="example@email.com" autoComplete="email" required describedBy={errors.email ? errorId.email : undefined} />

				<p id={errorId.email} className={styles.field_error}>
					{errors.email?.message}
				</p>
			</div>

			<div className={styles.field_group}>
				<TextInput
					name="userName"
					control={control}
					label="사용자 이름"
					placeholder="2~20자로 입력하세요"
					autoComplete="username"
					required
					describedBy={errors.userName ? errorId.userName : undefined}
				/>

				<p id={errorId.userName} className={styles.field_error}>
					{errors.userName?.message}
				</p>
			</div>

			<div className={styles.field_group}>
				<PasswordInput
					name="password"
					control={control}
					label="비밀번호"
					placeholder="영문과 숫자를 조합해 주세요"
					autoComplete="new-password"
					required
					describedBy={describedBy(passwordHelpId, errors.password && errorId.password)}
				/>

				<div>
					<p id={passwordHelpId} className={styles.field_help}>
						6~20자의 영문과 숫자 조합
					</p>

					<p id={errorId.password} className={styles.field_error}>
						{errors.password?.message}
					</p>
				</div>
			</div>

			<div className={styles.field_group}>
				<PasswordInput
					name="passwordRepeat"
					control={control}
					label="비밀번호 확인"
					placeholder="비밀번호를 다시 입력하세요"
					autoComplete="new-password"
					required
					describedBy={describedBy(errors.passwordRepeat && errorId.passwordRepeat, errors.root && errorId.root)}
				/>

				<p id={errorId.passwordRepeat} className={styles.field_error}>
					{errors.passwordRepeat?.message}
				</p>

				{/* 서버가 되돌려준 실패는 초점이 옮겨 가지 않아 스스로 읽히지 않는다.
				    폼에서 유일하게 live 영역이 필요한 자리다. */}
				<p id={errorId.root} className={`${styles.field_error} ${styles.root_error}`} role="alert" aria-live="polite">
					{errors.root?.message}
				</p>
			</div>

			<SubmitButton style={{marginTop: 6}} disabled={isSubmitting}>
				{isSubmitting ? "가입중" : "회원가입"}
			</SubmitButton>
		</form>
	);
}
