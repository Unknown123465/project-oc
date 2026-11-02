"use client";

import Link from "next/link";
import styles from "./Comments.module.css";
import CommentItem from "./CommentItem";
import CommentWriteForm from "./CommentWriteForm";
import {COMMENT_MESSAGE, CommentFromTemplate} from "@/app/template/[uuid]/commentMessage";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {commentForm, CommentFormType} from "@/app/template/[uuid]/validator";
import {useId, useState, useSyncExternalStore} from "react";
import {deleteComment, editComment} from "@/app/template/[uuid]/comment";
import {useRouter} from "next/navigation";
import useConfirm from "@/hooks/useConfirm";
import {useSession} from "next-auth/react";

interface CommentsProps {
	uuid: string;
	comments: CommentFromTemplate[] | null;
	/** 프로필 제작자면 남의 코멘트에 숨김/표시 버튼이 보인다. */
	isOwner: boolean;
	/** 비공개 프로필은 목록과 입력란 없이 안내 문구만 보인다. */
	isPrivate: boolean;
	serverNow: number;
}

const timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;
let now: number = Date.now();

const subscribe = (storeChange: () => void) => {
	const loopFn = () => {
		now = Date.now();
		storeChange();
	};

	loopFn();

	const loop: number = window.setInterval(loopFn, 1000 * 60);

	return () => {
		window.clearInterval(loop);
	};
};
const getSnapshot = () => now;
const getServerSnapshot = () => null;

export default function Comments({uuid, comments, isOwner, isPrivate, serverNow}: CommentsProps) {
	const {start, component} = useConfirm({confirmLabel: "확인", cancelLabel: "취소"});

	const session = useSession();

	const {
		control,
		formState: {errors},
		handleSubmit,
		setValue,
		setError,
		clearErrors,
	} = useForm({
		defaultValues: {
			comment: "",
		},
		resolver: zodResolver(commentForm),
		mode: "onChange",
	});

	const router = useRouter();

	/* 수정 중인 코멘트 하나의 id. 다른 코멘트의 수정을 누르면 값이 바뀌어 앞의 수정 화면은
	   원래 모습으로 돌아가고, 고치던 내용은 저장되지 않고 사라진다(수정 폼이 언마운트된다). */
	const [editTarget, setEditTarget] = useState<string | null>(null);

	const [isSending, setIsSending] = useState<boolean>(false);

	const titleId = useId();

	const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	const editStart = async (commentId: string, charComment: string) => {
		if (editTarget !== null) {
			setIsSending(true);

			const result = await start("다른 코멘트를 수정할까요?", "지금 고치던 내용은 저장되지 않고 사라져요.");

			setIsSending(false);

			if (!result) {
				return;
			}
		}

		setEditTarget(commentId);

		setValue("comment", charComment);

		clearErrors("root");
		clearErrors("comment");
	};

	const editCancel = () => {
		setEditTarget(null);

		setValue("comment", "");
	};

	const editSubmit = async ({comment}: CommentFormType) => {
		try {
			if (editTarget === null) {
				throw new Error("수정중인 코멘트가 없어요.");
			}

			setIsSending(true);

			const result = await editComment({uuid, commentId: editTarget, comment});

			if (result.success) {
				setEditTarget(null);

				router.refresh();
			} else {
				throw new Error(result.message);
			}
		} catch (err) {
			if (err instanceof Error) {
				setError("root", {
					message: err.message,
				});
			}
		} finally {
			setIsSending(false);
		}
	};

	const deleteStart = async (commentId: string): Promise<string> => {
		try {
			setIsSending(true);

			const confirmResult = await start("코멘트를 삭제할까요?", "삭제한 코멘트는 되돌릴 수 없어요.");

			if (!confirmResult) {
				return "";
			}

			const serverResult = await deleteComment({uuid, commentId});

			if (serverResult.success) {
				router.refresh();

				return "";
			} else {
				throw new Error(serverResult.message);
			}
		} catch (err) {
			return err instanceof Error ? err.message : COMMENT_MESSAGE.deleteFailed;
		} finally {
			setIsSending(false);
		}
	};

	if (isPrivate) {
		return (
			<section className={styles.comments} aria-labelledby={titleId}>
				<h2 id={titleId}>코멘트</h2>

				<p className={styles.notice}>비공개 프로필에는 코멘트를 작성할 수 없어요.</p>
			</section>
		);
	}

	/* getCommentsByTemplate은 코멘트가 없을 때도 null을 돌려준다. */
	const list: CommentFromTemplate[] = comments ?? [];

	let writeComment;

	if (session.status !== "loading" && session.data?.user?.id) {
		writeComment = <CommentWriteForm uuid={uuid} />;
	} else if (session.status !== "loading" && !session.data?.user?.id) {
		writeComment = (
			<p className={styles.login}>
				<Link href={`/login?link=template&uuid=${uuid}`}>로그인</Link>하면 코멘트를 남길 수 있어요.
			</p>
		);
	} else {
		writeComment = <p className={styles.login}>로그인 정보를 불러오는 중이에요.</p>;
	}

	return (
		<section className={styles.comments} aria-labelledby={titleId}>
			<h2 id={titleId}>
				코멘트 <span>{list.length}</span>
			</h2>

			{list.length === 0 ? (
				<p className={styles.notice}>아직 코멘트가 없어요. 첫 감상을 남겨 주세요.</p>
			) : (
				<form className={styles.list} onSubmit={handleSubmit(editSubmit)}>
					{list.map((comment) => (
						<CommentItem
							key={comment.commentId}
							uuid={uuid}
							comment={comment}
							isOwner={isOwner}
							isEditing={comment.commentId === editTarget}
							control={control}
							disabled={isSending}
							errors={errors}
							now={now ?? serverNow}
							timeZone={now !== null ? timeZone : "Asia/Seoul"}
							onEdit={() => editStart(comment.commentId, comment.charComment)}
							onCancelEdit={editCancel}
							onDelete={deleteStart}
						/>
					))}

					{component}
				</form>
			)}

			{writeComment}
		</section>
	);
}
