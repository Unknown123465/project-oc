"use client";

import {useId, useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import styles from "./SettingSection.module.css";
import {ActionButton} from "@/components/ui/button";
import {TextInput} from "@/components/ui/input";
import {requestEmailChange} from "@/app/setting/setAccountInfo";
import {changeEmailForm, type ChangeEmailFormType} from "@/app/setting/validator";

interface EmailRowProps {
	email: string | null;
	/** 소셜 가입이면 서비스 이름(예: "네이버"), 일반 가입이면 null. */
	socialProviderName: string | null;
}

/* 사용자 이름 행과 같은 방식으로 입력란이 열린다. 다만 제출해도 바로 바뀌지 않고, 새 주소로
   간 확인 메일의 버튼을 눌러야 바뀐다. 그래서 성공하면 메일을 보냈다는 안내만 남긴다. */
export default function EmailRow({email, socialProviderName}: EmailRowProps) {
	const baseId = useId();
	const errorId = `${baseId}-error`;

	const [editing, setEditing] = useState<boolean>(false);

	/* 확인 메일을 보낸 주소. 값이 있으면 안내 문구를 띄운다. */
	const [sentTo, setSentTo] = useState<string>("");

	const {
		control,
		handleSubmit,
		reset,
		setError,
		formState: {errors, isSubmitting},
	} = useForm<ChangeEmailFormType>({
		defaultValues: {email: ""},
		resolver: zodResolver(changeEmailForm),
		mode: "onSubmit",
	});

	const startEdit = () => {
		reset({email: ""});
		setSentTo("");
		setEditing(true);
	};

	const cancelEdit = () => {
		reset({email: ""});
		setEditing(false);
	};

	const onSubmit = async (data: ChangeEmailFormType) => {
		try {
			const result = await requestEmailChange(data);

			if (result.success) {
				setSentTo(result.result);
				setEditing(false);
			} else {
				setError("email", {
					message: result.message,
				});
			}
		} catch {
			setError("email", {
				message: "메일을 보내는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
			});
		}
	};

	const emailText = email !== null ? <span className={styles.text}>{email}</span> : <span className={styles.empty}>등록된 이메일이 없어요.</span>;

	if (socialProviderName !== null) {
		return (
			<div className={styles.row}>
				<dt>이메일</dt>
				<dd className={styles.value}>
					{emailText}

					<small>{socialProviderName} 계정으로 가입해서 이메일은 바꿀 수 없어요.</small>
				</dd>
			</div>
		);
	}

	return (
		<div className={styles.row}>
			<dt>이메일</dt>

			{editing ? (
				<dd className={styles.value}>
					<form className={styles.inline_form} onSubmit={handleSubmit(onSubmit)} noValidate>
						<TextInput
							name="email"
							control={control}
							label="새 이메일 주소"
							ariaLabelOnly
							height={40}
							placeholder="new@email.com"
							autoComplete="email"
							spellCheck={false}
							disabled={isSubmitting}
							describedBy={errors.email ? errorId : undefined}
						/>

						<p id={errorId} className={`${styles.message} ${styles.error}`} aria-live="polite">
							{errors.email?.message}
						</p>
					</form>

					<small>새 주소로 확인 메일을 보내요. 메일의 버튼을 눌러야 바뀌어요.</small>
				</dd>
			) : (
				<dd className={styles.value}>
					{emailText}

					<small className={styles.sent_message} aria-live="polite">
						{sentTo ? `확인 메일을 보냈어요. 5분 안에 ${sentTo} 메일함에서 "이메일 변경" 버튼을 눌러 주세요.\n메일이 안 보이면 스팸메일함도 확인해 주세요.` : null}
					</small>
				</dd>
			)}

			<dd className={styles.action}>
				{editing ? (
					<div className={styles.action_group}>
						<ActionButton onClick={cancelEdit} disabled={isSubmitting}>
							취소
						</ActionButton>

						<ActionButton styleType="attention" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
							{isSubmitting ? "보내는 중" : "변경"}
						</ActionButton>
					</div>
				) : (
					<ActionButton onClick={startEdit}>변경</ActionButton>
				)}
			</dd>
		</div>
	);
}
