"use client";

import {useId, useLayoutEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import formStyles from "../signup/SignupForm.module.css";
import styles from "./ResetPasswordRequestForm.module.css";
import {TextInput} from "@/components/ui/input";
import {SubmitButton} from "@/components/ui/button";
import {describedBy} from "@/components/ui/aria";
import {requestPasswordReset} from "@/app/resetpw/action";
import {requestPasswordResetForm, type RequestPasswordResetFormType} from "@/app/resetpw/validator";

interface ResetPasswordRequestFormProps {
	/** 링크를 쓸 수 있는 시간(분). 보낸 뒤 안내 문구에 넣는다. */
	expiresMinutes: number;
}

/* 입력 칸과 오류 문구는 가입 폼(SignupForm.module.css)과 같은 모양을 쓴다.
   메일을 보내면 폼 자리에 보낸 주소와 다음 할 일을 보여 준다. */
export default function ResetPasswordRequestForm({expiresMinutes}: ResetPasswordRequestFormProps) {
	const baseId = useId();

	const errorId = {
		email: `${baseId}-email-error`,
		userName: `${baseId}-user-name-error`,
	} as const;

	const [sentEmail, setSentEmail] = useState<string | null>(null);

	const {
		control,
		setError,
		clearErrors,
		handleSubmit,
		formState: {errors, isSubmitting, isValid},
	} = useForm<RequestPasswordResetFormType>({
		defaultValues: {
			email: "",
			userName: "",
		},
		resolver: zodResolver(requestPasswordResetForm),
		mode: "onChange",
	});

	useLayoutEffect(() => {
		if (isValid && errors.root?.message) {
			clearErrors("root");
		}
	}, [isValid, errors.root?.message]);

	const onSubmit = async (data: RequestPasswordResetFormType) => {
		try {
			const result = await requestPasswordReset(data);

			if (result.success) {
				setSentEmail(result.email);
			} else {
				setError("root", {
					message: result.message,
				});
			}
		} catch {
			setError("root", {
				message: "인증 메일을 보내는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
			});
		}
	};

	if (sentEmail !== null) {
		return (
			<div className={styles.sent} role="status">
				<i className="bi bi-envelope-check" aria-hidden="true"></i>

				<p className={styles.sent_title}>인증 메일을 보냈어요.</p>

				<p className={styles.sent_email}>{sentEmail}</p>

				<p className={styles.sent_text}>
					메일함에서 <b>[프로젝트 OC] 비밀번호 재설정</b> 메일을 열고 <b>비밀번호 재설정</b> 버튼을 눌러 주세요. 링크는 {expiresMinutes}분 동안 쓸 수 있어요. 메일이 안 보이면 스팸메일함도
					확인해 주세요.
				</p>
			</div>
		);
	}

	return (
		<form className={formStyles.signup_form} onSubmit={handleSubmit(onSubmit)} noValidate>
			<div className={formStyles.field_group}>
				<TextInput name="email" control={control} label="이메일 주소" placeholder="example@email.com" autoComplete="email" required describedBy={errors.email ? errorId.email : undefined} />

				<p id={errorId.email} className={formStyles.field_error}>
					{errors.email?.message ?? <>&nbsp;</>}
				</p>
			</div>

			<div className={formStyles.field_group}>
				<TextInput
					name="userName"
					control={control}
					label="사용자 이름"
					placeholder="로그인할 때 쓴 이름"
					autoComplete="username"
					required
					describedBy={describedBy(errors.userName && errorId.userName)}
				/>

				<p id={errorId.userName} className={formStyles.field_error} aria-live="polite">
					{errors.userName?.message ?? errors.root?.message ?? <>&nbsp;</>}
				</p>
			</div>

			<SubmitButton style={{marginTop: 6}} disabled={isSubmitting}>
				{isSubmitting ? "전송 중" : "인증 메일 전송"}
			</SubmitButton>
		</form>
	);
}
