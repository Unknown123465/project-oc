"use client";

import {useCallback, useState, type ChangeEvent, type CSSProperties} from "react";
import styles from "./styles.module.css";
import {FieldValues, useController, type UseControllerProps} from "react-hook-form";

interface InputProps<K extends FieldValues> extends UseControllerProps<K> {
	width?: number | string;
	height?: number | string;
	padding?: number | string;
	borderRadius?: number | string;
	style?: CSSProperties;
	focusAnimation?: boolean;
	invalidStyle?: boolean;
	readOnly?: boolean;
}

interface TextInputProps<K extends FieldValues> extends InputProps<K> {
	placeholder?: string;
}

export function TextInput<K extends FieldValues>({
	width,
	height,
	padding,
	borderRadius,
	style,
	focusAnimation = true,
	invalidStyle = true,
	readOnly,
	disabled,
	placeholder,
	...fieldProps
}: TextInputProps<K>) {
	const {field, fieldState} = useController(fieldProps);

	return (
		<div className={styles.box} style={{width, height, ...style}}>
			<input
				{...field}
				type="text"
				className={`${focusAnimation ? styles.focus_animation : ""} ${invalidStyle && fieldState.invalid ? styles.invalid : ""}`}
				readOnly={readOnly}
				aria-readonly={readOnly}
				disabled={disabled}
				aria-disabled={disabled}
				style={{padding, borderRadius}}
				placeholder={placeholder}
			/>
		</div>
	);
}

export function PasswordInput<K extends FieldValues>({
	width,
	height,
	padding,
	borderRadius,
	style,
	focusAnimation = true,
	invalidStyle = true,
	readOnly,
	disabled,
	placeholder,
	...fieldProps
}: TextInputProps<K>) {
	const {field, fieldState} = useController(fieldProps);

	const [show, setShow] = useState<boolean>(false);

	const showChange = useCallback((e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
		const {checked} = e.target;

		setShow(checked);
	}, []);

	return (
		<div className={styles.box} style={{width, height, ...style}}>
			<input
				{...field}
				type={show ? "text" : "password"}
				className={`${focusAnimation && fieldState.isTouched ? styles.focus_animation : ""} ${invalidStyle && fieldState.invalid ? styles.invalid : ""}`}
				readOnly={readOnly}
				aria-readonly={readOnly}
				disabled={disabled}
				aria-disabled={disabled}
				style={{padding, borderRadius}}
				placeholder={placeholder}
			/>

			<label className={styles.eye} role="checkbox" aria-checked={show}>
				<i className={`bi ${show ? "bi-eye" : "bi-eye-slash"}`}></i>
				<input type="checkbox" name="eye" checked={show} hidden onChange={showChange} />
			</label>
		</div>
	);
}
