"use client";

import {useState} from "react";
import styles from "./ProfileLike.module.css";
import {applyLikeFormat} from "./likeCountFormat";
import {setCharacterLike} from "@/app/template/[uuid]/characterLike";
import {useSession} from "next-auth/react";
import useConfirm from "@/hooks/useConfirm";
import {useRouter} from "next/navigation";
import {useScrollLock} from "@/hooks/useScrollLock";

export interface ProfileLikeView {
	count: number;
	liked: boolean;
	/** 제작자는 자기 프로필에 좋아요를 누를 수 없어 버튼 대신 숫자만 본다. */
	isOwner: boolean;
}

interface ProfileLikeProps {
	uuid: string;
	like: ProfileLikeView;
}

export default function ProfileLike({uuid, like}: ProfileLikeProps) {
	const {start, component} = useConfirm({confirmLabel: "로그인", cancelLabel: "닫기", blockHooks: false});

	const session = useSession();
	const router = useRouter();

	const [scrollLock, setScrollLock] = useState<boolean>(false);

	const [count, setCount] = useState<number>(like.count);
	const [liked, setLiked] = useState<boolean>(like.liked);
	const [isSending, setIsSending] = useState<boolean>(false);

	const [errorMessage, setErrorMessage] = useState<string>("");

	useScrollLock(scrollLock);

	const sendLike = async () => {
		if (!session.data) {
			setScrollLock(true);

			const result = await start("로그인이 필요해요", "좋아요는 로그인한 뒤에 누를 수 있어요.");

			setScrollLock(false);

			if (result) {
				router.push("/login");
			}

			return;
		}

		try {
			setIsSending(true);

			const result = await setCharacterLike(uuid);

			if (result.success) {
				setCount(result.count);
				setLiked(result.result === "insert");

				setErrorMessage("");

				router.refresh();
			} else {
				throw new Error(result.reason);
			}
		} catch (err) {
			if (!(err instanceof Error)) {
				return;
			}

			const reason: string = err.message;

			if (reason === "not-logged-in") {
				setErrorMessage("로그인이 풀렸어요. 다시 로그인한 뒤 눌러 주세요.");
			} else if (reason === "character-not-found" || reason === "fk-error") {
				setErrorMessage("프로필을 찾을 수 없어요. 삭제됐거나 비공개로 바뀌었을 수 있어요.");
			} else if (reason === "attempt-self-like") {
				setErrorMessage("내 프로필에는 좋아요를 누를 수 없어요.");
			} else if (reason === "db-error") {
				setErrorMessage(`좋아요를 ${liked ? "취소하지" : "보내지"} 못했어요. 잠시 후 다시 눌러 주세요.`);
			} else if (reason === "not-a-uuid") {
				setErrorMessage("프로필 주소가 올바르지 않아요. 링크를 다시 확인해 주세요.");
			} else if (reason === "attempt-try-twice" || reason === "no-delete-row") {
				/* 처리는 됐지만 개수를 다시 세지 못한 경우라 화면이 실제 상태와 다를 수 있다. */
				setErrorMessage("좋아요 상태를 확인하지 못했어요. 새로고침해 주세요.");
			} else {
				/* 서버 액션 요청 자체가 실패한 경우(네트워크 끊김 등). 사유 문자열이 아니라 오류 메시지가 들어온다. */
				setErrorMessage(`좋아요를 ${liked ? "취소하지" : "보내지"} 못했어요. 인터넷 연결을 확인한 뒤 다시 눌러 주세요.`);
			}
		} finally {
			setIsSending(false);
		}
	};

	if (like.isOwner) {
		return (
			<p className={styles.owner_count}>
				<i className="bi bi-heart-fill" aria-hidden="true"></i>

				<span>좋아요</span>

				<strong>{applyLikeFormat(count)}</strong>
			</p>
		);
	}

	return (
		<>
			<button type="button" className={styles.like} disabled={isSending} aria-pressed={liked} onClick={sendLike}>
				<i className={liked ? "bi bi-heart-fill" : "bi bi-heart"} aria-hidden="true"></i>

				<span>좋아요</span>

				<strong>{applyLikeFormat(count)}</strong>
			</button>

			<p className={styles.error_message} role="status">
				{errorMessage}
			</p>

			{component}
		</>
	);
}
