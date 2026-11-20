"use client";

import {useId, useLayoutEffect} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
/* 비밀번호 변경 폼과 같은 모양이라 CSS도 같이 쓴다. */
import styles from "../setting/ChangePasswordForm.module.css";
import {PasswordInput} from "@/components/ui/input";
import {LinkButton, SubmitButton} from "@/components/ui/button";
import {describedBy} from "@/components/ui/aria";
import {resetPassword} from "@/app/auth/resetpw/[token]/resetPassword";
import {resetPasswordForm, type ResetPasswordFormType} from "@/app/resetpw/validator";

interface ResetPasswordFormProps {
	/** 메일 링크 주소의 토큰. 제출할 때 같이 보낸다. */
	token: string;
	/** 비밀번호 관리자가 어느 계정의 비밀번호인지 알 수 있게 숨은 칸에 넣는다. */
	userName: string;
}

export default function ResetPasswordForm({token, userName}: ResetPasswordFormProps) {
	const baseId = useId();

	const errorId = {
		newPassword: `${baseId}-new-error`,
		newPasswordRepeat: `${baseId}-repeat-error`,
	} as const;

	const newPasswordHelpId = `${baseId}-new-help` as const;

	const {
		control,
		setError,
		clearErrors,
		handleSubmit,
		formState: {errors, isSubmitting, isSubmitSuccessful, isValid},
	} = useForm<ResetPasswordFormType>({
		defaultValues: {
			newPassword: "",
			newPasswordRepeat: "",
		},
		resolver: zodResolver(resetPasswordForm),
		mode: "onChange",
	});

	useLayoutEffect(() => {
		if (isValid && errors.root?.message) {
			clearErrors("root");
		}
	}, [isValid, errors.root?.message]);

	/* 성공하면 액션이 완료 페이지로 redirect해서 여기로 결과가 돌아오지 않는다. */
	const onSubmit = async (data: ResetPasswordFormType) => {
		try {
			const result = await resetPassword(token, data);

			if (result.path) {
				setError(result.path, {
					message: result.message,
				});
			} else {
				setError("root", {
					message: result.message,
				});
			}
		} catch {
			setError("root", {
				message: "비밀번호 재설정 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
			});
		}
	};

	const isSending: boolean = isSubmitting || isSubmitSuccessful;

	return (
		<form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
			<input type="text" name="username" autoComplete="username" value={userName} readOnly hidden />

			<div className={styles.field_group}>
				<PasswordInput
					name="newPassword"
					control={control}
					label="새 비밀번호"
					autoComplete="new-password"
					required
					disabled={isSending}
					describedBy={describedBy(newPasswordHelpId, errors.newPassword && errorId.newPassword)}
				/>

				<div>
					<p id={newPasswordHelpId} className={styles.field_help}>
						6~20자의 영문과 숫자 조합
					</p>

					<p id={errorId.newPassword} className={styles.field_error}>
						{errors.newPassword?.message}
					</p>
				</div>
			</div>

			<div className={styles.field_group}>
				<PasswordInput
					name="newPasswordRepeat"
					control={control}
					label="새 비밀번호 확인"
					autoComplete="new-password"
					required
					disabled={isSending}
					describedBy={describedBy(errors.newPasswordRepeat && errorId.newPasswordRepeat)}
				/>

				<p id={errorId.newPasswordRepeat} className={styles.field_error} aria-live="polite">
					{errors.newPasswordRepeat?.message ?? errors.root?.message ?? <>&nbsp;</>}
				</p>
			</div>

			<div className={styles.actions}>
				<LinkButton href="/" styleType="simple">
					취소
				</LinkButton>

				<SubmitButton disabled={isSending}>{isSending ? "재설정 중" : "비밀번호 재설정"}</SubmitButton>
			</div>
		</form>
	);
}
