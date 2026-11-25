"use client";

import {useState, useTransition} from "react";
import styles from "./SettingSection.module.css";
import {ActionButton} from "@/components/ui/button";
import usePrompt from "@/hooks/usePrompt";
import {deleteAccount, deleteAllCharacters} from "@/app/setting/deleteAccount";

interface DangerSectionProps {
	/** 삭제를 확인할 때 입력해야 하는 값. 비밀번호가 없는 소셜 가입자도 같은 방식으로 확인할 수 있어 사용자 이름을 쓴다. */
	username: string;
}

type Pending = "characters" | "account" | null;

export default function DangerSection({username}: DangerSectionProps) {
	const [isPending, startTransition] = useTransition();

	const [workingTarget, setWorkingTarget] = useState<Pending>(null);

	const [message, setMessage] = useState<string>("");

	/* 지운 결과 안내와 실패 안내가 같은 자리에 뜬다. 실패만 빨간색으로 보인다. */
	const [messageIsError, setMessageIsError] = useState<boolean>(false);

	const deleteCharactersPrompt = usePrompt({confirmLabel: "모두 삭제", cancelLabel: "취소", inputLabel: "확인할 사용자 이름"});
	const deleteAccountPrompt = usePrompt({confirmLabel: "계정 삭제", cancelLabel: "취소", inputLabel: "확인할 사용자 이름"});

	const handleDeleteCharacters = async () => {
		const answer: string | null = await deleteCharactersPrompt.start(
			"프로필을 모두 지울까요?",
			<>
				만든 프로필과 거기에 달린 좋아요, 코멘트가 전부 지워져요. 되돌릴 수 없어요.
				{"\n"}
				계속하려면 아래에 사용자 이름(<strong>{username}</strong>)을 입력해 주세요.
			</>,
			username
		);

		/* 취소하거나 창을 닫았다. */
		if (answer === null) {
			return;
		}

		if (answer !== username) {
			setMessageIsError(true);
			setMessage("사용자 이름이 맞지 않아요. 다시 시도해 주세요.");

			return;
		}

		startTransition(async () => {
			try {
				setWorkingTarget("characters");
				setMessage("");

				const result = await deleteAllCharacters();

				if (result.success) {
					startTransition(() => {
						setMessageIsError(false);
						setMessage(result.result > 0 ? `프로필 ${result.result}개를 지웠어요.` : "지울 프로필이 없었어요.");
					});
				} else {
					startTransition(() => {
						setMessageIsError(true);
						setMessage(result.message);
					});
				}
			} catch {
				startTransition(() => {
					setMessageIsError(true);
					setMessage("지우는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
				});
			} finally {
				startTransition(() => {
					setWorkingTarget(null);
				});
			}
		});
	};

	const handleDeleteAccount = async () => {
		const answer: string | null = await deleteAccountPrompt.start(
			"계정을 삭제할까요?",
			<>
				계정과 만든 프로필, 보낸 좋아요와 코멘트가 전부 지워지고 되돌릴 수 없어요.
				{"\n"}
				계속하려면 아래에 사용자 이름(<strong>{username}</strong>)을 입력해 주세요.
			</>,
			username
		);

		/* 취소하거나 창을 닫았다. */
		if (answer === null) {
			return;
		}

		if (answer !== username) {
			setMessageIsError(true);
			setMessage("사용자 이름이 맞지 않아요. 다시 시도해 주세요.");

			return;
		}

		try {
			setWorkingTarget("account");
			setMessage("");

			const result = await deleteAccount();

			if (result.success) {
				window.location.replace("/");
			} else {
				setMessageIsError(true);
				setMessage(result.message);
				setWorkingTarget(null);
			}
		} catch {
			setMessageIsError(true);
			setMessage("지우는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
			setWorkingTarget(null);
		}
	};

	return (
		<section id="danger" className={`${styles.section} ${styles.danger}`} aria-labelledby="setting-danger-title">
			<h2 id="setting-danger-title">위험 구역</h2>

			<dl className={styles.rows}>
				<div className={styles.row}>
					<dt>프로필 모두 삭제</dt>
					<dd className={styles.value}>
						<span className={styles.text}>만든 프로필과 받은 좋아요, 코멘트가 함께 지워져요.</span>
					</dd>
					<dd className={styles.action}>
						<ActionButton styleType="danger" ariaHasPopup="dialog" onClick={handleDeleteCharacters} disabled={workingTarget !== null || isPending}>
							{workingTarget === "characters" && isPending ? "삭제 중" : "모두 삭제"}
						</ActionButton>
					</dd>
				</div>

				<div className={styles.row}>
					<dt>계정 삭제</dt>
					<dd className={styles.value}>
						<span className={styles.text}>계정과 모든 데이터가 지워지고 되돌릴 수 없어요.</span>
					</dd>
					<dd className={styles.action}>
						<ActionButton styleType="danger" ariaHasPopup="dialog" onClick={handleDeleteAccount} disabled={workingTarget !== null || isPending}>
							{workingTarget === "account" ? "삭제 중" : "계정 삭제"}
						</ActionButton>
					</dd>
				</div>
			</dl>

			<p className={`${styles.message} ${messageIsError ? styles.error : styles.success}`} aria-live="polite">
				{message}
			</p>

			{deleteCharactersPrompt.component}
			{deleteAccountPrompt.component}
		</section>
	);
}
