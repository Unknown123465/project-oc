"use client";

import {useId, type CSSProperties} from "react";
import styles from "./styles.module.css";
import {FieldValues, useController, type UseControllerProps} from "react-hook-form";

interface SelectOption {
	value: string;
	label: string;
}

interface SelectProps<K extends FieldValues> extends UseControllerProps<K> {
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
	/** 입력을 설명하는 요소들의 id. 여러 개면 공백으로 이어 넘긴다. */
	describedBy?: string;
	required?: boolean;
	options: SelectOption[];
	placeholder?: string;
}

/* 안내 문구와 검증 오류는 이 파일에서 그리지 않는다. TextInput과 동일한 원칙 -
   무엇을 어디에 어떤 순서로 낼지는 폼마다 다르므로 호출하는 쪽이 아래에 직접 렌더하고,
   그 요소의 id를 describedBy로 넘겨 select와 연결한다. */

export function Select<K extends FieldValues>({
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
	disabled,
	describedBy,
	required,
	options,
	placeholder,
	...fieldProps
}: SelectProps<K>) {
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

			<div className={styles.box} style={{height}}>
				<select
					{...field}
					id={inputId}
					className={`${focusAnimation ? styles.focus_animation : ""} ${invalidStyle && fieldState.invalid ? styles.invalid : ""}`}
					aria-label={ariaLabelOnly ? label : undefined}
					disabled={disabled}
					aria-disabled={disabled}
					aria-invalid={fieldState.invalid}
					aria-describedby={describedBy}
					aria-required={required}
					style={{padding, borderRadius}}>
					{placeholder ? <option value="">{placeholder}</option> : null}

					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>

				<i className={`bi bi-caret-down-fill ${styles.chevron}`} aria-hidden="true"></i>
			</div>
		</div>
	);
}
