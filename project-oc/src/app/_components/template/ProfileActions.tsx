"use client";

import Link from "next/link";
import styles from "./ProfileActions.module.css";
import {useState, useTransition} from "react";
import ShareDialog, {type KakaoShareDetail} from "./ShareDialog";
import useConfirm from "@/hooks/useConfirm";
import {ActionButton, LinkButton} from "@/components/ui/button";
import {deleteCharacter} from "@/app/template/[uuid]/deleteCharacter";
import {useRouter, useSearchParams} from "next/navigation";
import {DELETE_CHARACTER_MESSAGE} from "@/app/template/[uuid]/deleteCharacterMessage";
import {toEncodeParam} from "@/app/edit/[uuid]/toEncodeParam";

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
	/** 수정, 삭제 버튼은 프로필 제작자에게만 그린다. */
	isOwner: boolean;
}

const DELETE_REDIRECT_URL = "/mylist?page=1" as const;

export default function ProfileActions({nonce, uuid, charName, charMessage, kakaoDetail, shareable, imageSrc, isPublic, isOwner}: ProfileActionsProps) {
	const {start, component} = useConfirm({confirmLabel: "삭제", cancelLabel: "취소", confirmStyleType: "danger"});

	const router = useRouter();

	const [isPending, startTransition] = useTransition();

	const [isSending, setIsSending] = useState<boolean>(false);
	const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

	const [errorMessage, setErrorMessage] = useState<string>("");

	/* 둘러보기 타일에서 들어오면 주소에 그때의 page, keyword, sort가 붙어 있다. 그대로 돌려줘서
	   보던 검색 결과와 페이지로 돌아가게 한다. 값이 틀려도 /browse가 고친 주소로 redirect한다. */
	const searchParams = useSearchParams();

	const browseURL: string =
		`/browse?${toEncodeParam("page", searchParams.get("page"), "1")}${toEncodeParam("keyword", searchParams.get("keyword"))}${toEncodeParam("sort", searchParams.get("sort"))}`.replace(/&+$/, "");

	const deleteProfile = async () => {
		setIsSending(true);
		setErrorMessage("");

		const confirmResult = await start(`'${charName}' 프로필을 삭제할까요?`, "삭제하면 되돌릴 수 없어요. 이미지와 받은 좋아요, 코멘트도 같이 지워져요.");

		setIsSending(false);

		if (!confirmResult) {
			return;
		}

		startTransition(async () => {
			try {
				const serverResult = await deleteCharacter(uuid);

				if (serverResult.success) {
					startTransition(() => {
						router.replace(DELETE_REDIRECT_URL);
					});
				} else if (serverResult.requireRefresh) {
					startTransition(() => {
						router.refresh();
					});
				} else {
					throw new Error(serverResult.message, {cause: true});
				}
			} catch (err) {
				if (err instanceof Error) {
					setErrorMessage(err.cause === true ? err.message : DELETE_CHARACTER_MESSAGE.failed);
				}
			}
		});
	};

	return (
		<>
			<div className={styles.actions}>
				<Link href={browseURL} className={styles.back_link}>
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

							<ActionButton className={styles.action_button} disabled={isSending || isPending} ariaHasPopup="dialog" onClick={() => setIsOpenModal(true)}>
								<i className="bi bi-share" aria-hidden="true"></i>
								공유
							</ActionButton>
						</>
					) : null}

					{isOwner ? (
						<>
							{component}
							<LinkButton href={`/edit/${uuid}?link=profile`} className={styles.action_button} styleType="simple">
								<i className="bi bi-pencil" aria-hidden="true"></i>
								수정
							</LinkButton>

							<ActionButton className={styles.action_button} disabled={isSending || isPending} styleType="danger" ariaHasPopup="dialog" onClick={deleteProfile}>
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
