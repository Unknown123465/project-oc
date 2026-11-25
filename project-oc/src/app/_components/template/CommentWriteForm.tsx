"use client";

import {useForm} from "react-hook-form";
import styles from "./Comments.module.css";
import {Textarea} from "@/components/ui/textarea";
import {SubmitButton} from "@/components/ui/button";
import {COMMENT_MAX_LENGTH, commentForm, type CommentFormType} from "@/app/template/[uuid]/validator";
import {zodResolver} from "@hookform/resolvers/zod";
import {writeComment} from "@/app/template/[uuid]/comment";
import {useTransition} from "react";

interface CommentWriteFormProps {
	uuid: string;
}

export default function CommentWriteForm({uuid}: CommentWriteFormProps) {
	const {
		control,
		formState: {errors, isSubmitting},
		handleSubmit,
		setValue,
		setError,
	} = useForm({
		defaultValues: {
			comment: "",
		},
		resolver: zodResolver(commentForm),
		mode: "onChange",
	});

	const [isPending, startTransition] = useTransition();

	const writeSubmit = async ({comment}: CommentFormType) => {
		startTransition(async () => {
			try {
				const result = await writeComment({uuid, comment});

				if (result.success) {
					startTransition(() => {
						setValue("comment", "");
					});
				} else {
					throw new Error(result.message);
				}
			} catch (err) {
				if (err instanceof Error) {
					startTransition(() => {
						setError("root", {
							message: err.message,
						});
					});
				}
			}
		});
	};

	const errorMessage: string | undefined = errors.root?.message ?? errors.comment?.message;

	return (
		<form className={styles.form} onSubmit={handleSubmit(writeSubmit)}>
			<Textarea name="comment" control={control} label="감상 남기기" rows={3} maxLength={COMMENT_MAX_LENGTH.normal} placeholder="캐릭터에 대한 감상을 적어 주세요." />

			{errorMessage ? (
				<p className={styles.error_message} role="alert">
					{errorMessage}
				</p>
			) : null}

			<div className={styles.form_actions}>
				<SubmitButton className={styles.submit_button} disabled={isSubmitting || isPending}>
					코멘트 등록
				</SubmitButton>
			</div>
		</form>
	);
}
