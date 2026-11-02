"use client";

import styles from "./Comments.module.css";
import {Textarea} from "@/components/ui/textarea";
import {ActionButton, SubmitButton} from "@/components/ui/button";
import {COMMENT_MAX_LENGTH, type CommentFormType} from "@/app/template/[uuid]/validator";
import {CommentFromTemplate} from "@/app/template/[uuid]/commentMessage";
import type {Control, FieldErrors} from "react-hook-form";
import {useFormValueLength} from "@/hooks/commetsWatch";
import {useState} from "react";
import {hideComment} from "@/app/template/[uuid]/comment";
import {useRouter} from "next/navigation";
import {toCommentTimeFormat} from "./commentTimeFormat";

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
	/* 숨김 요청이 성공하면 바로 바꾸는 숨긴 state다. comment.hidden은 router.refresh()가 완료돼야 바뀌어서, comment.hidden에 의존하면 버튼 문구가 잠깐 이전 state로 남아 후술할 isHiddenComment와 맞지 않게 된다. */
	const [isHidden, setIsHidden] = useState<boolean>(comment.hidden);
	/* isHidden state와 비슷하지만 사용자가 코멘트 보기 버튼을 누르면 숨겨진 코멘트를 보이게 할지 여부가 할당된 state다. */
	const [isHiddenComment, setIsHiddenComment] = useState<boolean>(comment.hidden);

	const [isSending, setIsSending] = useState<boolean>(false);

	const [errorMessage, setErrorMessage] = useState<string>("");

	const router = useRouter();

	const stringLength = useFormValueLength(control, "comment");

	const message: string | undefined = isEditing ? (errors.root?.message ?? errors.comment?.message) : errorMessage;

	const hideChange = async () => {
		try {
			setIsSending(true);
			setErrorMessage("");

			const result = await hideComment({uuid, commentId: comment.commentId});

			if (result.success) {
				setIsHidden(result.result === "hide");
				setIsHiddenComment(result.result === "hide");
				setErrorMessage("");

				router.refresh();
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
					{isHiddenComment ? (
						<div className={styles.blind}>
							<p>{isOwner ? "본인이" : "프로필 제작자가"} 숨긴 코멘트예요.</p>

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
										<ActionButton className={styles.small_button} disabled={disabled || isSending} onClick={onEdit}>
											수정
										</ActionButton>

										<ActionButton className={styles.small_button} disabled={disabled || isSending} onClick={() => deleteStart(comment.commentId)}>
											삭제
										</ActionButton>
									</>
								) : (
									<ActionButton className={styles.small_button} disabled={disabled || isSending} onClick={hideChange}>
										{isHidden ? "표시하기" : "숨기기"}
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
