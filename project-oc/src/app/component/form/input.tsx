"use client";

import {useCallback, useState, type ChangeEvent, type CSSProperties} from "react";
import styles from "./styles.module.css";

interface InputProps {
	width?: number | string;
	height?: number | string;
	padding?: number | string;
	borderRadius?: number | string;
	style?: CSSProperties;
	focusAnimation?: boolean;
	name: string;
	readOnly?: boolean;
	disabled?: boolean;
	value: string;
	onChange: (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => void;
}

export function TextInput({width, height, padding, borderRadius, style, focusAnimation = true, name, readOnly, disabled, value, onChange}: InputProps) {
	return (
		<div className={styles.box} style={{width, height, ...style}}>
			<input
				type="text"
				className={focusAnimation ? styles.focus_animation : undefined}
				name={name}
				readOnly={readOnly}
				aria-readonly={readOnly}
				disabled={disabled}
				aria-disabled={disabled}
				style={{padding, borderRadius}}
				value={value}
				onChange={onChange}
			/>
		</div>
	);
}

export function PasswordInput({width, height, padding, borderRadius, style, focusAnimation = true, name, readOnly, disabled, value, onChange}: InputProps) {
	const [show, setShow] = useState<boolean>(false);

	const showChange = useCallback((e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
		const {checked} = e.target;

		setShow(checked);
	}, []);

	return (
		<div className={styles.box} style={{width, height, ...style}}>
			<input
				type={show ? "text" : "password"}
				className={focusAnimation ? styles.focus_animation : undefined}
				name={name}
				readOnly={readOnly}
				aria-readonly={readOnly}
				disabled={disabled}
				aria-disabled={disabled}
				style={{padding, borderRadius}}
				value={value}
				onChange={onChange}
			/>

			<label className={styles.eye} role="checkbox" aria-checked={show}>
				<i className={`bi ${show ? "bi-eye" : "bi-eye-slash"}`}></i>
				<input type="checkbox" name="eye" checked={show} hidden onChange={showChange} />
			</label>
		</div>
	);
}
