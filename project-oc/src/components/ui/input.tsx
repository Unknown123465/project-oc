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
	placeholder,
	...fieldProps
}: TextInputProps<K>) {
	const {field, fieldState} = useController(fieldProps);

	const defaultId = useId();

	const inputId = id ?? defaultId;

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
					aria-describedby={describedBy}
					autoComplete={autoComplete}
					style={{padding, borderRadius}}
					placeholder={placeholder}
				/>
			</div>
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
	placeholder,
	...fieldProps
}: TextInputProps<K>) {
	const {field, fieldState} = useController(fieldProps);

	const defaultId = useId();

	const [show, setShow] = useState<boolean>(false);

	const inputId = id ?? defaultId;

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
					aria-describedby={describedBy}
					autoComplete={autoComplete}
					style={{padding, borderRadius}}
					placeholder={placeholder}
				/>

				<button type="button" className={styles.eye} aria-pressed={show} aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"} onClick={() => setShow((prev) => !prev)}>
					<i className={`bi ${show ? "bi-eye" : "bi-eye-slash"}`} aria-hidden="true"></i>
				</button>
			</div>
		</div>
	);
}
