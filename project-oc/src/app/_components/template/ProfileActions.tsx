"use client";

import Link from "next/link";
import styles from "./ProfileActions.module.css";
import {useState} from "react";
import ShareDialog, {type KakaoShareDetail} from "./ShareDialog";

interface ProfileActionsProps {
	nonce: string | undefined;
	uuid: string;
	charName: string;
	charMessage: string;
	kakaoDetail: KakaoShareDetail;
	/** 비공개 프로필은 공유할 수 없어 공유 버튼을 그리지 않는다. */
	shareable: boolean;
	imageSrc: string;

	isPublic: boolean;
}

export default function ProfileActions({nonce, uuid, charName, charMessage, kakaoDetail, shareable, imageSrc, isPublic}: ProfileActionsProps) {
	const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

	return (
		<div className={styles.actions}>
			<Link href="/" className={styles.back_link}>
				← 둘러보기
			</Link>

			{shareable ? (
				<>
					<ShareDialog
						nonce={nonce}
						uuid={uuid}
						characterName={charName}
						characterMessage={charMessage}
						kakaoDetail={kakaoDetail}
						imageSrc={imageSrc}
						isPublic={isPublic}
						open={isOpenModal}
						onClose={() => setIsOpenModal(false)}
					/>

					<button type="button" className={styles.share} aria-haspopup="dialog" onClick={() => setIsOpenModal(true)}>
						<i className="bi bi-share" aria-hidden="true"></i>
						공유
					</button>
				</>
			) : null}
		</div>
	);
}
