"use client";

import {useId} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import styles from "./ChangePasswordForm.module.css";
import {PasswordInput} from "@/components/ui/input";
import {LinkButton, SubmitButton} from "@/components/ui/button";
import {describedBy} from "@/components/ui/aria";
import {changePasswordAction} from "@/app/setting/changepw/action";
import {changePasswordForm, type ChangePasswordFormType} from "@/app/setting/validator";

interface ChangePasswordFormProps {
	/** 비밀번호 관리자가 어느 계정의 비밀번호인지 알 수 있게 숨은 칸에 넣는다. */
	userName: string;
}

export default function ChangePasswordForm({userName}: ChangePasswordFormProps) {
	const baseId = useId();

	const errorId = {
		currentPassword: `${baseId}-current-error`,
		newPassword: `${baseId}-new-error`,
		newPasswordRepeat: `${baseId}-repeat-error`,
		root: `${baseId}-root-error`,
	} as const;

	const newPasswordHelpId = `${baseId}-new-help` as const;

	const {
		control,
		setError,
		handleSubmit,
		formState: {errors, isSubmitting, isSubmitSuccessful},
	} = useForm<ChangePasswordFormType>({
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			newPasswordRepeat: "",
		},
		resolver: zodResolver(changePasswordForm),
		mode: "onSubmit",
	});

	const onSubmit = async (data: ChangePasswordFormType) => {
		try {
			const result = await changePasswordAction(data);

			if (result.success) {
				window.location.replace("/setting/changepw/complete");
			} else if (result.path) {
				setError(result.path, {message: result.message});
			} else {
				setError("root", {message: result.message});
			}
		} catch {
			setError("root", {message: "바꾸는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요."});
		}
	};

	/* 성공한 뒤 페이지를 옮기는 동안에도 버튼이 다시 눌리지 않게 막아 둔다. */
	const isSending: boolean = isSubmitting || isSubmitSuccessful;

	return (
		<form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
			<input type="text" name="username" autoComplete="username" value={userName} readOnly hidden />

			<div className={styles.field_group}>
				<PasswordInput
					name="currentPassword"
					control={control}
					label="현재  비밀번호"
					autoComplete="current-password"
					required
					disabled={isSending}
					describedBy={errors.currentPassword ? errorId.currentPassword : undefined}
				/>

				<p id={errorId.currentPassword} className={styles.field_error}>
					{errors.currentPassword?.message}
				</p>
			</div>

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
					describedBy={describedBy(errors.newPasswordRepeat && errorId.newPasswordRepeat, errors.root && errorId.root)}
				/>

				<p id={errorId.newPasswordRepeat} className={styles.field_error}>
					{errors.newPasswordRepeat?.message}
				</p>

				{/* 서버가 돌려준 실패는 초점이 옮겨 가지 않아 스스로 읽히지 않는다. */}
				<p id={errorId.root} className={`${styles.field_error} ${styles.root_error}`} role="alert" aria-live="polite">
					{errors.root?.message}
				</p>
			</div>

			<div className={styles.actions}>
				<LinkButton href="/setting" styleType="simple">
					취소
				</LinkButton>

				<SubmitButton disabled={isSending}>{isSending ? "변경 중" : "비밀번호 변경"}</SubmitButton>
			</div>
		</form>
	);
}
