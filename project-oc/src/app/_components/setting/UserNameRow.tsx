"use client";

import {useId, useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "next/navigation";
import styles from "./SettingSection.module.css";
import {ActionButton} from "@/components/ui/button";
import {TextInput} from "@/components/ui/input";
import {changeUserName} from "@/app/setting/setAccountInfo";
import {changeUserNameForm, type ChangeUserNameFormType, SAME_USER_NAME_MESSAGE} from "@/app/setting/validator";
import {USER_NAME_MAX_LENGTH, USER_NAME_MIN_LENGTH} from "@/app/signup/validator";

interface UserNameRowProps {
	username: string;
	isSocial: boolean;
}

/* 변경을 누르면 이름 자리가 입력란으로 바뀌고, 버튼 자리에 취소와 제출이 나온다. */
export default function UserNameRow({username, isSocial}: UserNameRowProps) {
	const router = useRouter();

	const baseId = useId();
	const errorId = `${baseId}-error`;

	const [currentName, setCurrentName] = useState<string>(username);

	const [editing, setEditing] = useState<boolean>(false);

	const {
		control,
		handleSubmit,
		reset,
		setError,
		formState: {errors, isSubmitting},
	} = useForm<ChangeUserNameFormType>({
		defaultValues: {userName: currentName},
		resolver: zodResolver(changeUserNameForm),
		mode: "onSubmit",
	});

	const startEdit = () => {
		reset({userName: currentName});
		setEditing(true);
	};

	const cancelEdit = () => {
		reset({userName: currentName});
		setEditing(false);
	};

	const onSubmit = async (data: ChangeUserNameFormType) => {
		/* 바뀌는 게 없으니 서버에 보내지 않는다. data.userName은 스키마가 앞뒤 공백을 잘라 둔 값이다. */
		if (data.userName === currentName) {
			setError("userName", {message: SAME_USER_NAME_MESSAGE});

			return;
		}

		try {
			const result = await changeUserName(data);

			if (result.success) {
				setCurrentName(result.result);
				setEditing(false);

				/* 프로필의 작성자 이름 등 서버가 그린 곳도 새 이름으로 다시 그린다. */
				router.refresh();
			} else {
				setError("userName", {
					message: result.message,
				});
			}
		} catch {
			setError("userName", {
				message: "바꾸는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
			});
		}
	};

	return (
		<div className={styles.row}>
			<dt>사용자 이름</dt>

			{editing ? (
				<dd className={styles.value}>
					<form className={styles.inline_form} onSubmit={handleSubmit(onSubmit)} noValidate>
						<TextInput
							name="userName"
							control={control}
							label="새 사용자 이름"
							ariaLabelOnly
							height={40}
							maxLength={USER_NAME_MAX_LENGTH}
							autoComplete="username"
							spellCheck={false}
							disabled={isSubmitting}
							describedBy={errors.userName ? errorId : undefined}
						/>

						<p id={errorId} className={`${styles.message} ${styles.error}`} aria-live="polite">
							{errors.userName?.message}
						</p>
					</form>

					{!isSocial ? (
						<small>
							{USER_NAME_MIN_LENGTH}~{USER_NAME_MAX_LENGTH}자로 입력해 주세요.
							{"\n"}
							바꾸면 다음 로그인부터 <span>새 이름으로</span> 입력해야 해요.
						</small>
					) : null}
				</dd>
			) : (
				<dd className={styles.value}>
					<span className={styles.text}>{currentName}</span>
					{!isSocial ? <small>로그인할 때 쓰는 이름이에요.</small> : null}
				</dd>
			)}

			<dd className={styles.action}>
				{editing ? (
					<div className={styles.action_group}>
						<ActionButton onClick={cancelEdit} disabled={isSubmitting}>
							취소
						</ActionButton>

						<ActionButton styleType="attention" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
							{isSubmitting ? "변경 중" : "변경"}
						</ActionButton>
					</div>
				) : (
					<ActionButton onClick={startEdit}>변경</ActionButton>
				)}
			</dd>
		</div>
	);
}
