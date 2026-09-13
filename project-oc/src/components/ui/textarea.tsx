"use client";

import {useId, type CSSProperties} from "react";
import styles from "./styles.module.css";
import {FieldValues, useController, type UseControllerProps} from "react-hook-form";

interface TextareaProps<K extends FieldValues> extends UseControllerProps<K> {
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
	/** 입력을 설명하는 요소들의 id. 여러 개면 공백으로 이어 넘긴다. */
	describedBy?: string;
	required?: boolean;
	placeholder?: string;
	rows?: number;
	maxLength?: number;
}

/* 안내 문구와 검증 오류는 이 파일에서 그리지 않는다. TextInput과 동일한 원칙 —
   무엇을 어디에 어떤 순서로 낼지는 폼마다 다르므로 호출하는 쪽이 아래에 직접 렌더하고,
   그 요소의 id를 describedBy로 넘겨 textarea와 연결한다. */

export function Textarea<K extends FieldValues>({
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
	required,
	placeholder,
	rows,
	maxLength,
	...fieldProps
}: TextareaProps<K>) {
	const {field, fieldState} = useController(fieldProps);

	const defaultId = useId();

	const inputId = id ?? defaultId;

	return (
		<div className={styles.field} style={{width, ...style}}>
			{!ariaLabelOnly ? (
				<label htmlFor={inputId}>
					{label} {required ? <span className={styles.required}>*</span> : null}
				</label>
			) : null}

			<textarea
				{...field}
				id={inputId}
				className={`${styles.textarea} ${focusAnimation ? styles.focus_animation : ""} ${invalidStyle && fieldState.invalid ? styles.invalid : ""}`}
				rows={rows}
				maxLength={maxLength}
				readOnly={readOnly}
				aria-label={ariaLabelOnly ? label : undefined}
				aria-readonly={readOnly}
				disabled={disabled}
				aria-disabled={disabled}
				aria-invalid={fieldState.invalid}
				aria-describedby={describedBy}
				aria-required={required}
				style={{height, padding, borderRadius, maxHeight: style?.maxHeight}}
				placeholder={placeholder}
			/>
		</div>
	);
}
