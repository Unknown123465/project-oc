"use client";

import Link from "next/link";
import styles from "./ProfileActions.module.css";
import {useState} from "react";
import ShareDialog, {type KakaoShareDetail} from "./ShareDialog";
import useConfirm from "@/hooks/useConfirm";
import {ActionButton} from "@/components/ui/button";
import {deleteCharacter} from "@/app/template/[uuid]/deleteCharacter";
import {useRouter} from "next/navigation";

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
	/** 삭제 버튼은 프로필 제작자에게만 그린다. */
	isOwner: boolean;
}

/* 지금은 메인 페이지로 리다이렉트 시킨다. 사용자가 제작한 프로필 리스트 페이지가 만들어지면 해당 주소로 리다이렉트 시킨다. */
const DELETE_REDIRECT_URL = "/" as const;

export default function ProfileActions({nonce, uuid, charName, charMessage, kakaoDetail, shareable, imageSrc, isPublic, isOwner}: ProfileActionsProps) {
	const {start, component} = useConfirm({confirmLabel: "삭제", cancelLabel: "취소", confirmStyleType: "danger"});

	const router = useRouter();

	const [isSending, setIsSending] = useState<boolean>(false);
	const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

	const [errorMessage, setErrorMessage] = useState<string>("");

	const deleteProfile = async () => {
		try {
			setIsSending(true);
			setErrorMessage("");

			const confirmResult = await start(`'${charName}' 프로필을 삭제할까요?`, "삭제하면 되돌릴 수 없어요. 이미지와 받은 좋아요, 코멘트도 같이 지워져요.");

			if (!confirmResult) {
				return;
			}

			const serverResult = await deleteCharacter(uuid);

			if (serverResult.success) {
				router.replace(DELETE_REDIRECT_URL);
			} else if (serverResult.requireRefresh) {
				router.refresh();
			} else {
				throw new Error(serverResult.message);
			}
		} catch (err) {
			if (err instanceof Error) {
				setErrorMessage(err.message);
			}
		} finally {
			setIsSending(false);
		}
	};

	return (
		<>
			<div className={styles.actions}>
				<Link href="/" className={styles.back_link}>
					← 둘러보기
				</Link>
				<div className={styles.buttons}>
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

							<ActionButton className={styles.action_button} disabled={isSending} ariaHasPopup="dialog" onClick={() => setIsOpenModal(true)}>
								<i className="bi bi-share" aria-hidden="true"></i>
								공유
							</ActionButton>
						</>
					) : null}

					{isOwner ? (
						<>
							{component}

							<ActionButton className={styles.action_button} disabled={isSending} styleType="danger" ariaHasPopup="dialog" onClick={deleteProfile}>
								<i className="bi bi-trash3" aria-hidden="true"></i>
								삭제
							</ActionButton>
						</>
					) : null}
				</div>
			</div>

			<p className={styles.error_message}>{errorMessage}</p>
		</>
	);
}
