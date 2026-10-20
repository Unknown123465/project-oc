"use client";

import {MouseEvent, useEffect, useRef, useState, useSyncExternalStore} from "react";
import styles from "./ShareDialog.module.css";
import {useScrollLock} from "@/hooks/useScrollLock";
import Script from "next/script";

/** 카카오 메시지를 채울 부가 정보. 페이지에 이미 보이는 값만 담는다. */
export interface KakaoShareDetail {
	creator: string;
	facts: {label: string; value: string}[];
	/** 비공개는 공유 자체가 없으니 null은 좋아요 정보가 없을 때뿐이다. */
	likeCount: number | null;
}

/* 카카오 피드 템플릿의 itemContent.items는 최대 5개다. */
const KAKAO_ITEM_LIMIT: number = 5;

interface ShareDialogProps {
	nonce: string | undefined;
	uuid: string;
	characterName: string;
	/** 캐릭터 한마디. og:description과 같은 값을 카카오 메시지 설명에도 쓴다. */
	characterMessage: string;
	kakaoDetail: KakaoShareDetail;
	imageSrc: string;
	isPublic: boolean;
	open: boolean;
	onClose: () => void;
}

type SNSType = "X" | "Bluesky" | "Threads";

function genURL(uuid: string): string {
	return location.origin + "/template/" + uuid;
}

function genSNSShareURL(sns: SNSType, uuid: string, characterName: string): string {
	const url: string = genURL(uuid);

	const text: string = `${characterName}의 프로필을 공유해요 | 프로젝트 OC`;

	switch (sns) {
		case "X":
			return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

		case "Bluesky":
			return `https://bsky.app/intent/compose?text=${encodeURIComponent(`${text} ${url}`)}`;

		case "Threads":
			return `https://www.threads.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
	}
}

function genWebShareData(uuid: string, characterName: string): ShareData {
	return {
		url: genURL(uuid),
		text: `${characterName}의 프로필을 구경해 보세요.`,
		title: `${characterName} 프로필 - 프로젝트 OC`,
	};
}

interface URLShareStatus {
	success: boolean;
	message: string;
}

type KakaoSDKLoadStatusType = "ready" | "loaded" | "success" | "failure";

function webShareCheck(characterName: string, uuid: string): string {
	const shareData = genWebShareData(characterName, uuid);

	if (!("share" in navigator)) {
		return "이 브라우저에서는 다른 앱으로 공유할 수 없어요. 링크 복사를 이용해 주세요.";
	} else if ("canShare" in navigator && !navigator.canShare(shareData)) {
		return "지금은 다른 앱으로 공유할 수 없어요. 링크 복사를 이용해 주세요.";
	} else {
		return "";
	}
}

const KAKAO_JS_KEY: string | undefined = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

/* 브라우저의 Web Share 지원 여부는 페이지가 떠 있는 동안 바뀌지 않아 구독할 것이 없다. */
const subscribeNothing = () => () => {};

export default function ShareDialog({nonce, uuid, characterName, characterMessage, kakaoDetail, imageSrc, isPublic, open, onClose}: ShareDialogProps) {
	useScrollLock(open);

	const [URLShareStatus, setURLShareStatus] = useState<URLShareStatus>({
		success: true,
		message: "",
	});
	/* navigator·location은 브라우저에만 있어 서버에서 그릴 때는 검사할 수 없다. 서버에서는
	   null(확인 전)로 그려 버튼만 비활성으로 두고("확인 중" 문구 없음), 하이드레이션이
	   끝나면 브라우저에서 검사한 문구로 바뀐다. 문자열을 돌려줘야 매번 같은 값으로 비교된다. */
	const webShareCheckMessage: string | null = useSyncExternalStore(
		subscribeNothing,
		() => webShareCheck(characterName, uuid),
		() => null,
	);

	const [kakaoSDKLoadStatus, setKakaoSDKLoadStatus] = useState<KakaoSDKLoadStatusType>("ready");

	const [webShareMessage, setWebShareMessage] = useState<string>("");

	const [isWebSharing, setIsWebSharing] = useState<boolean>(true);

	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog: HTMLDialogElement | null = dialogRef.current;

		if (dialog === null) {
			return;
		}

		if (open && dialog.open !== open) {
			dialog.showModal();
		} else if (!open && dialog.open !== open) {
			dialog.close();

			setURLShareStatus({
				success: true,
				message: "",
			});
			setWebShareMessage("");
		}
	}, [open]);

	const handleBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
		const dialog: HTMLDialogElement | null = dialogRef.current;

		if (dialog === null || e.target !== dialog) {
			return;
		}

		const rect: DOMRect = dialog.getBoundingClientRect();
		const insideDialog: boolean = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

		if (!insideDialog) {
			dialog.close();
		}
	};

	const kakaoLoadResult = (result: boolean) => {
		if (!window.Kakao || !KAKAO_JS_KEY || !result) {
			setKakaoSDKLoadStatus("failure");

			return;
		} else if (window.Kakao.isInitialized()) {
			setKakaoSDKLoadStatus("success");

			return;
		}

		setKakaoSDKLoadStatus("loaded");

		try {
			window.Kakao.init(KAKAO_JS_KEY);

			setKakaoSDKLoadStatus(window.Kakao.isInitialized() ? "success" : "failure");
		} catch {
			setKakaoSDKLoadStatus("failure");
		}
	};

	const URLShareStart = async () => {
		try {
			setURLShareStatus({
				success: true,
				message: "",
			});

			await navigator.clipboard.writeText(location.origin + "/template/" + uuid);

			setURLShareStatus({
				success: true,
				message: "링크가 복사되었어요. 원하는 곳에 붙여 넣으면 돼요.",
			});
		} catch {
			setURLShareStatus({
				success: false,
				message: "링크 복사에 실패했어요. 클립보드 권한을 허용한 뒤, 다시 시도해 주세요.",
			});
		}
	};

	const SNSShareStart = (sns: SNSType) => {
		const url: string = genSNSShareURL(sns, uuid, characterName);

		const tag: HTMLAnchorElement = document.createElement("a");

		tag.href = url;
		tag.target = "_blank";
		tag.rel = "noopener noreferrer";

		tag.click();
	};

	const kakaoTalkShareStart = () => {
		if (kakaoSDKLoadStatus !== "success" || !window.Kakao) {
			return;
		}

		const url: string = genURL(uuid);

		window.Kakao.Share.sendDefault({
			objectType: "feed",
			content: {
				/* 카카오 메시지는 맨 아래에 앱 이름이 따로 붙어 사이트 이름을 제목에 넣지 않는다. */
				title: `${characterName}의 프로필`,
				description: characterMessage,
				imageUrl: isPublic ? imageSrc : `${location.origin}/share-fallback.png`,
				link: {
					mobileWebUrl: url,
					webUrl: url,
				},
			},
			itemContent: {
				profileText: `제작 ${kakaoDetail.creator}`,
				items: kakaoDetail.facts.slice(0, KAKAO_ITEM_LIMIT).map((fact) => ({item: fact.label, itemOp: fact.value})),
			},
			social:
				kakaoDetail.likeCount === null
					? undefined
					: {
							likeCount: kakaoDetail.likeCount,
						},
			buttons: [
				{
					title: "프로필 보기",
					link: {
						mobileWebUrl: url,
						webUrl: url,
					},
				},
			],
			installTalk: true,
		});
	};

	const webShareStart = async () => {
		try {
			const shareData = genWebShareData(characterName, uuid);

			setIsWebSharing(false);

			await navigator.share(shareData);
		} catch (err) {
			if (err instanceof Error && err.name !== "AbortError") {
				setWebShareMessage("공유 창을 열지 못했어요. 다시 눌러 보거나 링크 복사를 이용해 주세요.");
			}
		} finally {
			setIsWebSharing(true);
		}
	};

	return (
		<>
			<Script
				src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.4/kakao.min.js"
				nonce={nonce}
				integrity="sha384-BGX7Wb16GmRFagri4bLJV2DgipVZaU2AI812GZtHtHzzDQJnfHasDXN5houxv45w"
				crossOrigin="anonymous"
				onReady={() => kakaoLoadResult(true)}
				onError={() => kakaoLoadResult(false)}
			/>
			<dialog className={styles.dialog} aria-labelledby="share-title" aria-describedby="share-description" ref={dialogRef} onClick={handleBackdropClick} onClose={onClose}>
				<div className={styles.head}>
					<h2 id="share-title">프로필 공유</h2>

					<button type="button" className={styles.close} aria-label="닫기" onClick={onClose}>
						<i className="bi bi-x-lg" aria-hidden="true"></i>
					</button>
				</div>

				<p id="share-description" className={styles.description}>
					<strong>{characterName}</strong>의 프로필을 공유합니다.
				</p>

				<button type="button" className={styles.copy} onClick={URLShareStart}>
					<i className="bi bi-link-45deg" aria-hidden="true"></i>
					링크 복사
				</button>

				<p className={`${styles.copy_message} ${URLShareStatus.success ? "" : styles.failed}`} role="status">
					{URLShareStatus.message}
				</p>

				<ul className={styles.targets}>
					<li>
						<button type="button" onClick={() => SNSShareStart("X")}>
							<i className="bi bi-twitter-x" aria-hidden="true"></i>
							<span>X</span>
						</button>
					</li>

					<li>
						<button type="button" onClick={() => SNSShareStart("Bluesky")}>
							<i className="bi bi-bluesky" aria-hidden="true"></i>
							<span>Bluesky</span>
						</button>
					</li>

					<li>
						<button type="button" onClick={() => SNSShareStart("Threads")}>
							<i className="bi bi-threads" aria-hidden="true"></i>
							<span>Threads</span>
						</button>
					</li>

					<li>
						<button type="button" disabled={kakaoSDKLoadStatus !== "success"} onClick={kakaoTalkShareStart}>
							<i className="bi bi-chat-fill" aria-hidden="true"></i>
							<span>카카오톡</span>
						</button>
					</li>
				</ul>

				<p className={styles.status}>{kakaoSDKLoadStatus === "failure" ? "카카오톡 공유를 사용할 수 없어요. 다른 플랫폼으로 공유해 주세요." : null}</p>

				<button type="button" className={styles.native} disabled={webShareCheckMessage !== "" || !isWebSharing} onClick={webShareStart}>
					<i className="bi bi-box-arrow-up" aria-hidden="true"></i>
					다른 앱으로 공유
				</button>

				{/* Web Share·카카오 SDK 실패 안내가 들어갈 자리. 비어 있으면 화면에 공간을 차지하지 않는다. */}
				<p className={styles.status} role="status">
					{webShareMessage || webShareCheckMessage}
				</p>
			</dialog>
		</>
	);
}
