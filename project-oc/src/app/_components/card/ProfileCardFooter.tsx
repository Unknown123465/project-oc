"use client";

import styles from "./ProfileCardFooter.module.css";
import {applyLikeFormat} from "@/app/_components/template/likeCountFormat";
import {useSession} from "next-auth/react";
import {useRouter} from "next/navigation";
import {useRef, useState} from "react";
import {ProfileLikeView} from "../template/ProfileLike";
import useConfirm from "@/hooks/useConfirm";
import type {UseImageDataURL} from "@/hooks/useImageDataURL";
import {useScrollLock} from "@/hooks/useScrollLock";
import {setCharacterLike} from "@/app/template/[uuid]/characterLike";
import {ActionButton, LinkButton} from "@/components/ui/button";
import ProfileCardCapture from "./ProfileCardCapture";
import {CardCharacter, toCharFileName} from "./cardCharacter";
import {toPng} from "html-to-image";

interface ProfileCardFooterProps {
	uuid: string;
	/** 비공개 프로필은 좋아요와 링크 복사를 그리지 않는다. */
	shareable: boolean;
	like: ProfileLikeView | null;
	character: CardCharacter;
	imageDataURL: UseImageDataURL;
}

interface Message {
	status: "normal" | "success" | "error";
	value: string;
}

export default function ProfileCardFooter({uuid, shareable, like, character, imageDataURL}: ProfileCardFooterProps) {
	const {start, component} = useConfirm({confirmLabel: "로그인", cancelLabel: "닫기", blockHooks: false});

	const session = useSession();
	const router = useRouter();

	const [scrollLock, setScrollLock] = useState<boolean>(false);

	const [count, setCount] = useState<number>(like?.count ?? 0);
	const [liked, setLiked] = useState<boolean>(like?.liked ?? false);
	const [isSending, setIsSending] = useState<boolean>(false);
	const [isDownloading, setIsDownloading] = useState<boolean>(false);

	const [message, setMessage] = useState<Message>({
		status: "normal",
		value: "",
	});

	const captureRef = useRef<HTMLDivElement>(null);

	useScrollLock(scrollLock);

	const sendLike = async () => {
		if (!session.data) {
			setScrollLock(true);

			const result = await start("로그인이 필요해요", "좋아요는 로그인한 뒤에 누를 수 있어요.");

			setScrollLock(false);

			if (result) {
				router.push(`/login?link=template&uuid=${uuid}`);
			}

			return;
		}

		try {
			setIsSending(true);
			setMessage({
				status: "normal",
				value: "",
			});

			const result = await setCharacterLike(uuid);

			if (result.success) {
				setCount(result.count);
				setLiked(result.result === "insert");

				setMessage({
					status: "normal",
					value: "",
				});

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
				setMessage({
					status: "error",
					value: "로그인이 풀렸어요. 다시 로그인한 뒤 눌러 주세요.",
				});
			} else if (reason === "character-not-found" || reason === "fk-error") {
				setMessage({
					status: "error",
					value: "프로필을 찾을 수 없어요. 삭제됐거나 비공개로 바뀌었을 수 있어요.",
				});
			} else if (reason === "attempt-self-like") {
				setMessage({
					status: "error",
					value: "내 프로필에는 좋아요를 누를 수 없어요.",
				});
			} else if (reason === "db-error") {
				setMessage({
					status: "error",
					value: `좋아요를 ${liked ? "취소하지" : "보내지"} 못했어요. 잠시 후 다시 눌러 주세요.`,
				});
			} else if (reason === "not-a-uuid") {
				setMessage({
					status: "error",
					value: "프로필 주소가 올바르지 않아요. 링크를 다시 확인해 주세요.",
				});
			} else if (reason === "attempt-try-twice" || reason === "no-delete-row") {
				/* 처리는 됐지만 개수를 다시 세지 못한 경우라 화면이 실제 상태와 다를 수 있다. */
				setMessage({
					status: "error",
					value: "좋아요 상태를 확인하지 못했어요. 새로고침해 주세요.",
				});
			} else {
				/* 서버 액션 요청 자체가 실패한 경우(네트워크 끊김 등). 사유 문자열이 아니라 오류 메시지가 들어온다. */
				setMessage({
					status: "error",
					value: `좋아요를 ${liked ? "취소하지" : "보내지"} 못했어요. 인터넷 연결을 확인한 뒤 다시 눌러 주세요.`,
				});
			}
		} finally {
			setIsSending(false);
		}
	};

	const copyLink = async () => {
		try {
			setMessage({
				status: "normal",
				value: "링크를 복사하는 중이에요. 조금만 기다려 주세요.",
			});

			const link: string = `${location.origin}/template/${uuid}/card`;

			await navigator.clipboard.writeText(link);

			setMessage({
				status: "success",
				value: "링크가 복사되었어요. 원하는 곳에 붙여 넣으면 돼요.",
			});
		} catch {
			setMessage({
				status: "error",
				value: "링크 복사에 실패했어요. 클립보드 권한을 허용한 뒤, 다시 시도해 주세요.",
			});
		}
	};

	const saveAsPNG = async () => {
		try {
			setIsDownloading(true);
			setMessage({
				status: "normal",
				value: "PNG로 변환 중이에요. 조금만 기다려 주세요.",
			});

			const captureTag: HTMLDivElement | null = captureRef.current;

			if (captureTag === null) {
				throw new Error("프로필 카드를 불러오지 못했어요. 다시 시도해 주세요.");
			} else if (imageDataURL.status !== "success" || imageDataURL.url === null) {
				throw new Error("캐릭터 이미지를 불러오지 못했어요. 새로고침 후 시도해 주세요.");
			}

			const captureURL: string = await toPng(captureTag, {
				cacheBust: false,
				pixelRatio: 1.5,
			});

			const anchorTag: HTMLAnchorElement = document.createElement("a");

			anchorTag.href = captureURL;
			anchorTag.download = toCharFileName(character.charName);

			anchorTag.click();

			setMessage({
				status: "success",
				value: "프로필 카드를 다운로드하고 있어요.",
			});
		} catch (err) {
			if (err instanceof Error) {
				setMessage({
					status: "error",
					value: err.message,
				});
			}
		} finally {
			setIsDownloading(false);
		}
	};

	let likeComponent;

	if (shareable && like !== null && !like.isOwner) {
		likeComponent = (
			<>
				<button type="button" className={`${styles.like} ${styles.button}`} disabled={isSending} aria-pressed={liked} onClick={sendLike}>
					<i className={liked ? "bi bi-heart-fill" : "bi bi-heart"} aria-hidden="true"></i>

					<span>좋아요</span>

					<strong>{applyLikeFormat(count)}</strong>
				</button>

				{component}
			</>
		);
	} else if (shareable && like?.isOwner) {
		likeComponent = (
			<>
				<div className={`${styles.like} ${styles.owner}`}>
					<i className="bi bi-heart-fill" aria-hidden="true"></i>

					<span>좋아요</span>

					<strong>{applyLikeFormat(count)}</strong>
				</div>
			</>
		);
	}

	return (
		<>
			<footer className={styles.footer}>
				<div className={styles.note}>
					<p>{shareable ? "카드는 1920 x 1080 PNG로 저장돼요." : "비공개 프로필이라 좋아요와 링크 공유가 없어요. 저장한 카드는 직접 보관해 주세요."}</p>

					{message.value || imageDataURL.message ? (
						<p
							className={`${styles.message} ${imageDataURL.message && message.status === "error" ? styles.error : styles[message.status]}`}
							role={message.status === "error" || imageDataURL.message ? "alert" : undefined}
						>
							{message.value || imageDataURL.message}
						</p>
					) : null}
				</div>

				<div className={styles.actions}>
					{likeComponent}

					{shareable ? (
						<ActionButton className={styles.ui_button} onClick={copyLink}>
							<i className="bi bi-link-45deg" aria-hidden="true"></i>
							링크 복사
						</ActionButton>
					) : null}

					<LinkButton href={`/template/${uuid}`} styleType="simple" className={styles.ui_button}>
						전체 프로필
					</LinkButton>

					<ActionButton styleType="attention" className={styles.ui_button} disabled={isDownloading || imageDataURL.status !== "success"} onClick={saveAsPNG}>
						<i className="bi bi-download" aria-hidden="true"></i>
						PNG 저장
					</ActionButton>
				</div>
			</footer>

			{imageDataURL.status === "success" ? <ProfileCardCapture captureRef={captureRef} character={character} imageDataURL={imageDataURL} /> : null}
		</>
	);
}
