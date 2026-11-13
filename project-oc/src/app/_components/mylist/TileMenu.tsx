"use client";

import Link from "next/link";
import styles from "./TileMenu.module.css";
import {toEncodeParam} from "@/app/edit/[uuid]/toEncodeParam";
import {useEffect, useRef, useState} from "react";
import ShareDialog, {type KakaoShareDetail} from "../template/ShareDialog";
import useConfirm from "@/hooks/useConfirm";
import {useRouter} from "next/navigation";
import {deleteCharacter} from "@/app/template/[uuid]/deleteCharacter";
import {DELETE_CHARACTER_MESSAGE} from "@/app/template/[uuid]/deleteCharacterMessage";

interface TileMenuProps {
	uuid: string;
	charName: string;
	charMessage: string;
	kakaoDetail: KakaoShareDetail;
	imageSrc: string;
	isPublic: boolean;
	/** 비공개 프로필은 공유할 수 없어 공유 항목을 그리지 않는다. */
	shareable: boolean;
	nonce: string | null;
	params: Record<string, string | string[] | undefined>;
}

/* details의 name이 같으면 브라우저가 한 번에 하나만 열어 둔다. 다른 타일의 메뉴를
   열면 앞서 열린 메뉴는 저절로 닫힌다. 공유 창은 메뉴가 닫혀도 남아 있어야 해서
   details 밖에 둔다. */
export default function TileMenu({uuid, charName, charMessage, kakaoDetail, imageSrc, isPublic, shareable, nonce, params}: TileMenuProps) {
	const {start, component} = useConfirm({confirmLabel: "삭제", cancelLabel: "취소", confirmStyleType: "danger"});

	const router = useRouter();

	const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

	const [isSending, setIsSending] = useState<boolean>(false);

	const detailsRef = useRef<HTMLDetailsElement>(null);

	const abort = useRef<AbortController>(null);

	useEffect(() => {
		return () => {
			abort.current?.abort();
		};
	}, []);

	const onToggle = () => {
		if (detailsRef.current?.open && abort.current === null) {
			abort.current = new AbortController();

			window.addEventListener(
				"pointerdown",
				(e) => {
					if (detailsRef.current?.contains(e.target as Node) === false) {
						detailsRef.current.open = false;
					}
				},
				{signal: abort.current.signal}
			);
		} else if (!detailsRef.current?.open) {
			abort.current?.abort();
			abort.current = null;
		}
	};

	const deleteProfile = async () => {
		try {
			if (detailsRef.current !== null) {
				detailsRef.current.open = false;
			}

			setIsSending(true);

			const confirmResult = await start(`'${charName}' 프로필을 삭제할까요?`, "삭제하면 되돌릴 수 없어요. 이미지와 받은 좋아요, 코멘트도 같이 지워져요.");

			if (!confirmResult) {
				return;
			}

			const serverResult = await deleteCharacter(uuid);

			if (serverResult.success || serverResult.requireRefresh) {
				router.refresh();
			} else {
				throw new Error(serverResult.message, {cause: true});
			}
		} catch (err) {
			if (err instanceof Error) {
				alert(err.cause === true ? err.message : DELETE_CHARACTER_MESSAGE.failed);
			}
		} finally {
			setIsSending(false);
		}
	};

	const editURL: string =
		`/edit/${uuid}?link=mylist&${toEncodeParam("page", params.page, "1")}${toEncodeParam("keyword", params.keyword)}${toEncodeParam("sort", params.sort)}${toEncodeParam("public_mode", params.public_mode)}`.replace(
			/&+$/,
			""
		);

	return (
		<>
			{shareable ? (
				<ShareDialog
					nonce={nonce ?? undefined}
					uuid={uuid}
					characterName={charName}
					characterMessage={charMessage}
					kakaoDetail={kakaoDetail}
					imageSrc={imageSrc}
					isPublic={isPublic}
					open={isOpenModal}
					onClose={() => setIsOpenModal(false)}
				/>
			) : null}
			{component}

			<details className={styles.menu} name="mylist-tile-menu" ref={detailsRef} onToggle={onToggle}>
				<summary aria-label={`${charName} 관리 메뉴`}>
					<i className="bi bi-three-dots" aria-hidden="true"></i>
				</summary>

				<div className={styles.popover}>
					<Link href={editURL}>
						<i className="bi bi-pencil" aria-hidden="true"></i>
						수정
					</Link>

					{shareable ? (
						<button type="button" disabled={isSending} aria-haspopup="dialog" onClick={() => setIsOpenModal(true)}>
							<i className="bi bi-share" aria-hidden="true"></i>
							공유
						</button>
					) : null}

					<Link href={`/template/${uuid}/card`}>
						<i className="bi bi-person-vcard" aria-hidden="true"></i>
						카드 보기
					</Link>

					<button type="button" className={styles.danger} disabled={isSending} aria-haspopup="dialog" onClick={deleteProfile}>
						<i className="bi bi-trash3" aria-hidden="true"></i>
						삭제
					</button>
				</div>
			</details>
		</>
	);
}
