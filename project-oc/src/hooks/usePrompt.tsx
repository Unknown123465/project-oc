"use client";

import {useEffect, useId, useRef, useState, type ChangeEvent, type MouseEvent, type ReactNode} from "react";
import type {ControllerFieldState} from "react-hook-form";
import styles from "./useConfirm.module.css";
import {ActionButton} from "@/components/ui/button";
import {TextInputWithField} from "@/components/ui/input";
import {useScrollLock} from "@/hooks/useScrollLock";
import {useBlockNavigation} from "@/hooks/useBlockNavigation";

interface UsePromptProps {
	confirmLabel: string;
	cancelLabel: string;
	/** 입력란의 라벨. 화면에는 보이지 않고 화면 낭독기만 읽는다. */
	inputLabel: string;
	blockHooks?: boolean;
	confirmStyleType?: "attention" | "danger";
}

interface PromptFormValues {
	answer: string;
}

/* 입력란 하나뿐이라 react-hook-form 없이 useState로 값을 들고 있는다. TextInputWithField가
   요구하는 fieldState는 검증을 하지 않으니 늘 같은 값이면 된다. */
const PROMPT_FIELD_STATE: ControllerFieldState = {
	invalid: false,
	isTouched: false,
	isDirty: false,
	isValidating: false,
	error: undefined,
};

/** useConfirm에 입력란을 더한 확인 모달. window.prompt처럼 확인을 누르면 입력한 값을, 취소하거나
 *  닫으면 null을 돌려준다. 입력이 맞는지는 부른 쪽이 판단한다. 프로필 모두 삭제, 계정 삭제처럼
 *  되돌릴 수 없는 동작에 쓴다. 실수를 막는 장치일 뿐이라 서버 액션은 이 입력과 상관없이 세션으로 권한을 확인한다. */
export default function usePrompt({confirmLabel, cancelLabel, inputLabel, blockHooks = true, confirmStyleType = "danger"}: UsePromptProps) {
	const titleId = useId();
	const descriptionId = useId();

	const [open, setOpen] = useState<boolean>(false);

	const [title, setTitle] = useState<string>("");
	const [description, setDescription] = useState<ReactNode | null>(null);

	const [answer, setAnswer] = useState<string>("");

	/* 입력란에 흐리게 보여 줄 예시. 열 때마다 부르는 쪽이 정한다. */
	const [placeholder, setPlaceholder] = useState<string>("");

	const promise = useRef<PromiseWithResolvers<string | null>>(null);

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
			promise.current?.resolve(null);
		};
	}, []);

	const startPrompt = async (titleValue: string, descriptionValue: ReactNode, placeholderValue: string = ""): Promise<string | null> => {
		const dialog: HTMLDialogElement | null = dialogRef.current;

		if (dialog === null) {
			return null;
		}

		setTitle(titleValue);
		setPlaceholder(placeholderValue);
		setDescription(descriptionValue);
		setAnswer("");

		promise.current?.resolve(null);

		const promiseResolver = Promise.withResolvers<string | null>();

		promise.current = promiseResolver;

		setOpen(true);

		return promiseResolver.promise;
	};

	/* Esc나 바깥 클릭으로 닫혀도 promise를 끝내야 부른 쪽의 뒷코드가 돈다. useConfirm과 같다. */
	const handleDialogClose = () => {
		promise.current?.resolve(null);
		promise.current = null;

		setOpen(false);
		setDescription(null);
		setAnswer("");
	};

	const requestSubmit = (result: string | null) => {
		promise.current?.resolve(result);
		promise.current = null;

		dialogRef.current?.close();
	};

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

			<TextInputWithField<PromptFormValues>
				name="answer"
				value={answer}
				onChange={(e: ChangeEvent<HTMLInputElement>) => setAnswer(e.target.value)}
				onBlur={() => {}}
				ref={() => {}}
				label={inputLabel}
				ariaLabelOnly
				placeholder={placeholder}
				autoComplete="off"
				spellCheck={false}
				fieldState={PROMPT_FIELD_STATE}
			/>

			<div className={styles.actions}>
				<ActionButton onClick={() => requestSubmit(null)}>{cancelLabel}</ActionButton>

				<ActionButton styleType={confirmStyleType} onClick={() => requestSubmit(answer)} disabled={answer === ""}>
					{confirmLabel}
				</ActionButton>
			</div>
		</dialog>
	);

	return {
		start: startPrompt,
		component,
	};
}
