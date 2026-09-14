"use client";

import {useEffect, useId, useRef, type MouseEvent, type ReactNode} from "react";
import styles from "./ConfirmModal.module.css";
import {ActionButton} from "@/components/ui/button";
import {useScrollLock} from "@/hooks/useScrollLock";
import {useBlockNavigation} from "@/hooks/useBlockNavigation";

export interface ConfirmModalProps {
	open: boolean;
	title: string;
	description: ReactNode;
	confirmLabel: string;
	cancelLabel: string;
	onConfirm: () => void;
	onCancel: () => void;
}

/* 파괴적인 동작(예: 레이아웃 변경 시 기존 크롭 초기화)을 확인받는 범용 모달.
   버튼 문구는 호출하는 쪽이 상황에 맞게 정한다 - "예/아니오" 같은 라벨은
   무엇에 대한 확인인지 다시 읽어야 알 수 있어 쓰지 않는다. */
export default function ConfirmModal({open, title, description, confirmLabel, cancelLabel, onConfirm, onCancel}: ConfirmModalProps) {
	useScrollLock(open);
	useBlockNavigation(open);

	const titleId = useId();
	const descriptionId = useId();

	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog: HTMLDialogElement | null = dialogRef.current;

		if (dialog === null) {
			return;
		}

		if (open && !dialog.open) {
			dialog.showModal();

			/* ActionButton이 ref를 넘겨주지 않아(autoFocus prop도 없음) 컴포넌트로는
			   초기 초점을 지정할 수 없다. 취소 버튼이 actions 안 첫 번째 button이라는
			   구조를 이용해 DOM에서 직접 찾아 초점을 준다 - 파괴적 확인이라 기본
			   선택은 항상 취소 쪽이어야 한다. */
			dialog.querySelector<HTMLButtonElement>(`.${styles.actions} button`)?.focus();
		} else if (!open && dialog.open) {
			dialog.close();
		}
	}, [open]);

	const requestCancel = () => {
		dialogRef.current?.close();
	};

	/* 네이티브 close 이벤트(Esc, 다이얼로그 스스로 닫힘)는 전부 취소로 본다.
	   확인은 반드시 확인 버튼 클릭을 통해서만 일어난다. */
	const handleDialogClose = () => {
		onCancel();
	};

	/* ::backdrop 클릭은 dialog 자신을 target으로 만든다. 실제 내용 영역 밖을 눌렀을 때만 닫는다. */
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

	return (
		<dialog ref={dialogRef} className={styles.backdrop} role="alertdialog" aria-labelledby={titleId} aria-describedby={descriptionId} onClose={handleDialogClose} onClick={handleBackdropClick}>
			<h2 id={titleId} className={styles.title}>
				{title}
			</h2>

			<div id={descriptionId} className={styles.description}>
				{description}
			</div>

			<div className={styles.actions}>
				<ActionButton onClick={requestCancel}>{cancelLabel}</ActionButton>

				<ActionButton styleType="attention" onClick={onConfirm}>
					{confirmLabel}
				</ActionButton>
			</div>
		</dialog>
	);
}
