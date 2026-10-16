"use client";

import {useEffect, useId, useRef, useState, type MouseEvent, type ReactNode} from "react";
import styles from "./useConfirm.module.css";
import {ActionButton} from "@/components/ui/button";
import {useScrollLock} from "@/hooks/useScrollLock";
import {useBlockNavigation} from "@/hooks/useBlockNavigation";

interface UseConfirmProps {
	confirmLabel: string;
	cancelLabel: string;
	blockHooks?: boolean;
}

/** 파괴적인 동작(예: 레이아웃 변경 시 기존 크롭 초기화)을 확인받는 범용 모달 hook.
   버튼 문구는 호출하는 쪽이 상황에 맞게 정한다 - "예/아니오" 같은 라벨은
   무엇에 대한 확인인지 다시 읽어야 알 수 있어 쓰지 않는다. */
export default function useConfirm({confirmLabel, cancelLabel, blockHooks = true}: UseConfirmProps) {
	const titleId = useId();
	const descriptionId = useId();

	const [open, setOpen] = useState<boolean>(false);

	const [title, setTitle] = useState<string>("");
	const [description, setDescription] = useState<ReactNode | null>(null);

	const promise = useRef<PromiseWithResolvers<boolean>>(null);

	const dialogRef = useRef<HTMLDialogElement>(null);

	useScrollLock(blockHooks && open);
	useBlockNavigation(blockHooks && open);

	useEffect(() => {
		if (open && dialogRef.current !== null) {
			dialogRef.current.showModal();
		}
	}, [open]);

	useEffect(() => {
		return () => {
			promise.current?.resolve(false);
		};
	}, []);

	const startConfirm = async (titleValue: string, descriptionValue: ReactNode) => {
		const dialog: HTMLDialogElement | null = dialogRef.current;

		if (dialog === null) {
			return false;
		}

		setTitle(titleValue);
		setDescription(descriptionValue);

		promise.current?.resolve(false);

		const promiseResolver = Promise.withResolvers<boolean>();

		promise.current = promiseResolver;

		setOpen(true);

		return promiseResolver.promise;
	};

	/* 모달이 열려 있는 동안 Esc, ::backdrop 클릭으로 모달이 닫히면 promise.current.promise를 resolve해서 끝내야 한다. 안 그러면 계속 pending 상태로 남아,
	   startConfirm을 실행한 함수의 뒷코드와 finally 블록이 실행되지 않고, 해당 promise 객체는 ref가 들고 있기 때문에
	   startConfirm을 부른 함수와 promise가 메모리에 남는다 */
	const handleDialogClose = () => {
		promise.current?.resolve(false);
		promise.current = null;

		setOpen(false);

		/* 다음 확인 전까지는 이전 본문을 붙잡지 않기 위해 null을 할당함
		 */
		setDescription(null);
	};

	const requestSubmit = (result: boolean) => {
		promise.current?.resolve(result);
		promise.current = null;

		dialogRef.current?.close();
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

	const component = (
		<dialog ref={dialogRef} className={styles.backdrop} role="alertdialog" aria-labelledby={titleId} aria-describedby={descriptionId} onClose={handleDialogClose} onClick={handleBackdropClick}>
			<h2 id={titleId} className={styles.title}>
				{title}
			</h2>

			<div id={descriptionId} className={styles.description}>
				{description}
			</div>

			<div className={styles.actions}>
				<ActionButton onClick={() => requestSubmit(false)}>{cancelLabel}</ActionButton>

				<ActionButton styleType="attention" onClick={() => requestSubmit(true)}>
					{confirmLabel}
				</ActionButton>
			</div>
		</dialog>
	);

	return {
		start: startConfirm,
		component,
	};
}
