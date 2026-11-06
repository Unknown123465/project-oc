"use client";

import styles from "./Comments.module.css";
import {Textarea} from "@/components/ui/textarea";
import {ActionButton, SubmitButton} from "@/components/ui/button";
import {COMMENT_MAX_LENGTH, type CommentFormType} from "@/app/template/[uuid]/validator";
import {CommentFromTemplate} from "@/app/template/[uuid]/commentMessage";
import type {Control, FieldErrors} from "react-hook-form";
import {useFormValueLength} from "@/hooks/commetsWatch";
import {useState, useTransition} from "react";
import {hideComment} from "@/app/template/[uuid]/comment";
import {useRouter} from "next/navigation";
import {toCommentTimeFormat} from "./commentTimeFormat";

function genHiddenMessage(messageType: "hidden" | "blinded", isOwner: boolean): string {
	if (messageType === "hidden") {
		return `${isOwner ? "본인이" : "프로필 제작자가"} 숨긴 코멘트예요.`;
	} else {
		return "자동으로 가려진 코멘트예요.";
	}
}

interface CommentItemProps {
	uuid: string;
	comment: CommentFromTemplate;
	/** 프로필 제작자면 남의 코멘트에 숨김·표시 버튼이 보인다. */
	isOwner: boolean;
	isEditing: boolean;
	disabled: boolean;
	control: Control<CommentFormType>;
	errors: FieldErrors<CommentFormType>;
	now: number;
	timeZone: string;
	onEdit: () => void;
	onCancelEdit: () => void;
	onDelete: (commentId: string) => Promise<string>;
}

export default function CommentItem({uuid, comment, isOwner, disabled, errors, isEditing, control, now, timeZone, onEdit, onCancelEdit, onDelete}: CommentItemProps) {
	const [isHiddenComment, setIsHiddenComment] = useState<boolean>(true);

	const [isSending, setIsSending] = useState<boolean>(false);

	const [errorMessage, setErrorMessage] = useState<string>("");

	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const stringLength = useFormValueLength(control, "comment");

	const hiddenMessage: string = genHiddenMessage(comment.blinded ? "blinded" : "hidden", isOwner);

	const message: string | undefined = isEditing ? (errors.root?.message ?? errors.comment?.message) : errorMessage;

	const hideChange = async () => {
		try {
			setIsSending(true);
			setErrorMessage("");

			const result = await hideComment({uuid, commentId: comment.commentId});

			if (result.success) {
				startTransition(() => {
					setIsHiddenComment(true);
					setErrorMessage("");

					router.refresh();
				});
			} else {
				throw new Error(result.message);
			}
		} catch (err) {
			if (err instanceof Error) {
				setErrorMessage(err.message);
			}
		} finally {
			setIsSending(false);
		}
	};

	const deleteStart = async (commentId: string) => {
		const result = await onDelete(commentId);

		setErrorMessage(result);
	};

	return (
		<article className={styles.comment} data-editing={isEditing}>
			<div className={styles.head}>
				<span className={styles.author}>{comment.userName}</span>

				<div className={styles.right}>
					{isEditing ? (
						<span>
							{stringLength} / {COMMENT_MAX_LENGTH.normal}자
						</span>
					) : null}

					<time className={styles.time} dateTime={comment.createdAt.toISOString()}>
						{toCommentTimeFormat(comment.createdAt, now, timeZone)}
						{comment.updated ? " (수정됨)" : null}
					</time>
				</div>
			</div>

			{isEditing ? (
				<div className={styles.edit_form}>
					<Textarea name="comment" control={control} label="코멘트 수정" ariaLabelOnly rows={3} maxLength={COMMENT_MAX_LENGTH.normal} />

					{message ? (
						<p className={styles.error_message} role="alert">
							{message}
						</p>
					) : null}

					<div className={styles.edit_actions}>
						<ActionButton className={styles.small_button} onClick={onCancelEdit}>
							취소
						</ActionButton>

						<SubmitButton className={styles.small_button} disabled={disabled}>
							저장
						</SubmitButton>
					</div>
				</div>
			) : (
				<>
					{(comment.hidden || comment.blinded) && isHiddenComment ? (
						<div className={styles.blind}>
							<p>{hiddenMessage}</p>

							<ActionButton className={styles.small_button} onClick={() => setIsHiddenComment(false)}>
								코멘트 보기
							</ActionButton>
						</div>
					) : (
						<p className={styles.body}>{comment.charComment}</p>
					)}

					{comment.isMine || isOwner ? (
						<>
							<div className={styles.actions}>
								{comment.isMine ? (
									<>
										<ActionButton className={styles.small_button} disabled={disabled || isSending || isPending} onClick={onEdit}>
											수정
										</ActionButton>

										<ActionButton className={styles.small_button} disabled={disabled || isSending || isPending} onClick={() => deleteStart(comment.commentId)}>
											삭제
										</ActionButton>
									</>
								) : (
									<ActionButton className={styles.small_button} disabled={disabled || isSending || isPending} onClick={hideChange}>
										{comment.hidden ? "표시하기" : "숨기기"}
									</ActionButton>
								)}
							</div>

							{message ? (
								<p className={styles.error_message} role="alert">
									{message}
								</p>
							) : null}
						</>
					) : null}
				</>
			)}
		</article>
	);
}
