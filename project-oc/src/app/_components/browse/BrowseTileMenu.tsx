"use client";

import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import styles from "../mylist/TileMenu.module.css";
import ShareDialog, {type KakaoShareDetail} from "../template/ShareDialog";

interface BrowseTileMenuProps {
	uuid: string;
	charName: string;
	charMessage: string;
	kakaoDetail: KakaoShareDetail;
	imageSrc: string;
	nonce: string | null;
}

/* /mylist의 TileMenu에서 수정과 삭제를 뺀 메뉴다. 남의 프로필이라 공유와 카드 보기만 둔다.
   details의 name이 같으면 브라우저가 한 번에 하나만 열어 둔다. 공유 창은 메뉴가 닫혀도
   남아 있어야 해서 details 밖에 둔다. */
export default function BrowseTileMenu({uuid, charName, charMessage, kakaoDetail, imageSrc, nonce}: BrowseTileMenuProps) {
	const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

	const detailsRef = useRef<HTMLDetailsElement>(null);

	const abort = useRef<AbortController>(null);

	useEffect(() => {
		return () => {
			abort.current?.abort();
		};
	}, []);

	/* 메뉴 밖을 누르면 닫는다. 열려 있는 동안에만 리스너를 둔다. */
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

	const openShare = () => {
		if (detailsRef.current !== null) {
			detailsRef.current.open = false;
		}

		setIsOpenModal(true);
	};

	return (
		<>
			<ShareDialog
				nonce={nonce ?? undefined}
				uuid={uuid}
				characterName={charName}
				characterMessage={charMessage}
				kakaoDetail={kakaoDetail}
				imageSrc={imageSrc}
				isPublic
				open={isOpenModal}
				onClose={() => setIsOpenModal(false)}
			/>

			<details className={styles.menu} name="browse-tile-menu" ref={detailsRef} onToggle={onToggle}>
				<summary aria-label={`${charName} 메뉴`}>
					<i className="bi bi-three-dots" aria-hidden="true"></i>
				</summary>

				<div className={styles.popover}>
					<button type="button" aria-haspopup="dialog" onClick={openShare}>
						<i className="bi bi-share" aria-hidden="true"></i>
						공유
					</button>

					<Link href={`/template/${uuid}/card`}>
						<i className="bi bi-person-vcard" aria-hidden="true"></i>
						카드 보기
					</Link>
				</div>
			</details>
		</>
	);
}
