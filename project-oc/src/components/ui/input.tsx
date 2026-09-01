"use client";

import {useCallback, useId, useState, type CSSProperties} from "react";
import styles from "./styles.module.css";
import {FieldValues, useController, type UseControllerProps} from "react-hook-form";

interface InputProps<K extends FieldValues> extends UseControllerProps<K> {
	label: string;
	ariaLabelOnly?: boolean;
	width?: number | string;
	height?: number | string;
	padding?: number | string;
	borderRadius?: number | string;
	style?: CSSProperties;
	id?: string;
	focusAnimation?: boolean;
	invalidStyle?: boolean;
	readOnly?: boolean;
	describedBy?: string;
	autoComplete?: string;
	/** 입력 아래에 항상 보이는 안내 문구. */
	help?: string;
	/** 입력 아래에 이 필드의 검증 오류를 직접 출력한다.
	 *  로그인처럼 오류를 폼 한곳에 모으는 화면은 끈 채로 둔다. */
	showFieldError?: boolean;
	required?: boolean;
}

/** 입력이 가리켜야 할 설명 요소들을 aria-describedby 한 줄로 합친다.
 *  describedBy(바깥에서 넘긴 것)와 컴포넌트가 직접 그리는 안내/오류가 함께 있을 수 있다. */
function joinDescribedBy(ids: (string | undefined)[]): string | undefined {
	return ids.filter(Boolean).join(" ") || undefined;
}

interface TextInputProps<K extends FieldValues> extends InputProps<K> {
	placeholder?: string;
}

export function TextInput<K extends FieldValues>({
	label,
	ariaLabelOnly = false,
	width,
	height,
	padding,
	borderRadius,
	style,
	id,
	focusAnimation = true,
	invalidStyle = true,
	readOnly,
	disabled,
	describedBy,
	autoComplete,
	help,
	showFieldError = false,
	required,
	placeholder,
	...fieldProps
}: TextInputProps<K>) {
	const {field, fieldState} = useController(fieldProps);

	const defaultId = useId();
	const helpId = useId();
	const fieldErrorId = useId();

	const inputId = id ?? defaultId;

	const fieldErrorMessage = showFieldError ? fieldState.error?.message : undefined;

	const ariaDescribedBy = joinDescribedBy([describedBy, help ? helpId : undefined, fieldErrorMessage ? fieldErrorId : undefined]);

	return (
		<div className={styles.field} style={{width, ...style}}>
			{!ariaLabelOnly ? <label htmlFor={inputId}>{label}</label> : null}

			<div className={styles.box} style={{height}}>
				<input
					{...field}
					id={inputId}
					type="text"
					className={`${focusAnimation ? styles.focus_animation : ""} ${invalidStyle && fieldState.invalid ? styles.invalid : ""}`}
					readOnly={readOnly}
					aria-label={ariaLabelOnly ? label : undefined}
					aria-readonly={readOnly}
					disabled={disabled}
					aria-disabled={disabled}
					aria-invalid={fieldState.invalid}
					aria-describedby={ariaDescribedBy}
					aria-required={required}
					autoComplete={autoComplete}
					style={{padding, borderRadius}}
					placeholder={placeholder}
				/>
			</div>

			{help ? (
				<p id={helpId} className={styles.help}>
					{help}
				</p>
			) : null}

			{/* 오류가 여러 필드에서 한꺼번에 나므로 필드마다 role="alert"를 두지 않는다.
			    제출 실패 시 react-hook-form이 첫 오류 필드로 초점을 옮기고,
			    그때 aria-describedby로 연결된 이 문구가 읽힌다. */}
			{fieldErrorMessage ? (
				<p id={fieldErrorId} className={styles.error}>
					{fieldErrorMessage}
				</p>
			) : null}
		</div>
	);
}

export function PasswordInput<K extends FieldValues>({
	label,
	ariaLabelOnly = false,
	width,
	height,
	padding,
	borderRadius,
	style,
	id,
	focusAnimation = true,
	invalidStyle = true,
	readOnly,
	disabled,
	describedBy,
	autoComplete,
	help,
	showFieldError = false,
	required,
	placeholder,
	...fieldProps
}: TextInputProps<K>) {
	const {field, fieldState} = useController(fieldProps);

	const defaultId = useId();
	const helpId = useId();
	const fieldErrorId = useId();

	const [show, setShow] = useState<boolean>(false);

	const inputId = id ?? defaultId;

	const fieldErrorMessage = showFieldError ? fieldState.error?.message : undefined;

	const ariaDescribedBy = joinDescribedBy([describedBy, help ? helpId : undefined, fieldErrorMessage ? fieldErrorId : undefined]);

	return (
		<div className={styles.field} style={{width, ...style}}>
			{!ariaLabelOnly ? <label htmlFor={inputId}>{label}</label> : null}

			<div className={styles.box} style={{height}}>
				<input
					{...field}
					id={inputId}
					type={show ? "text" : "password"}
					className={`${styles.has_action} ${focusAnimation ? styles.focus_animation : ""} ${invalidStyle && fieldState.invalid ? styles.invalid : ""}`}
					readOnly={readOnly}
					aria-label={ariaLabelOnly ? label : undefined}
					aria-readonly={readOnly}
					disabled={disabled}
					aria-disabled={disabled}
					aria-invalid={fieldState.invalid}
					aria-describedby={ariaDescribedBy}
					aria-required={required}
					autoComplete={autoComplete}
					style={{padding, borderRadius}}
					placeholder={placeholder}
				/>

				<button type="button" className={styles.eye} aria-pressed={show} aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"} onClick={() => setShow((prev) => !prev)}>
					<i className={`bi ${show ? "bi-eye" : "bi-eye-slash"}`} aria-hidden="true"></i>
				</button>
			</div>

			{help ? (
				<p id={helpId} className={styles.help}>
					{help}
				</p>
			) : null}

			{/* 오류가 여러 필드에서 한꺼번에 나므로 필드마다 role="alert"를 두지 않는다.
			    제출 실패 시 react-hook-form이 첫 오류 필드로 초점을 옮기고,
			    그때 aria-describedby로 연결된 이 문구가 읽힌다. */}
			{fieldErrorMessage ? (
				<p id={fieldErrorId} className={styles.error}>
					{fieldErrorMessage}
				</p>
			) : null}
		</div>
	);
}
