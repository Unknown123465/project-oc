"use client";

import {type Ref, useId, type ChangeEvent, type CSSProperties, type ReactNode} from "react";
import styles from "./styles.module.css";

interface SelectProps {
	name: string;
	label: string;
	/** option 목록. <option>을 그대로 넘긴다. */
	children: ReactNode;
	defaultValue?: string;
	onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
	ariaLabelOnly?: boolean;
	width?: number | string;
	height?: number | string;
	style?: CSSProperties;
	className?: string;
	ref?: Ref<HTMLSelectElement>;
	id?: string;
	focusAnimation?: boolean;
	disabled?: boolean;
	/** 입력을 설명하는 요소들의 id. 여러 개면 공백으로 이어 넘긴다. */
	describedBy?: string;
	required?: boolean;
}

/* react-hook-form 없이 폼 기본 제출(next/form 등)에 그대로 실리는 select.
   안내 문구와 검증 오류는 input.tsx처럼 호출하는 쪽이 그리고, 그 요소의 id를
   describedBy로 넘겨 연결한다. 기본 화살표는 브라우저마다 모양이 달라 appearance로
   지우고 아이콘으로 다시 그린다. */
export function Select({
	name,
	label,
	children,
	defaultValue,
	onChange,
	ariaLabelOnly = false,
	width,
	height,
	style,
	className,
	ref,
	id,
	focusAnimation = true,
	disabled,
	describedBy,
	required,
}: SelectProps) {
	const defaultId = useId();

	const selectId = id ?? defaultId;

	return (
		<div className={`${styles.field} ${className ?? ""}`} style={{width, ...style}}>
			{!ariaLabelOnly ? (
				<label htmlFor={selectId}>
					{label} {required ? <span className={styles.required}>*</span> : null}
				</label>
			) : null}

			<div className={styles.select_box} style={{height}}>
				<select
					id={selectId}
					name={name}
					defaultValue={defaultValue}
					onChange={onChange}
					className={focusAnimation ? styles.focus_animation : undefined}
					ref={ref}
					disabled={disabled}
					required={required}
					aria-label={ariaLabelOnly ? label : undefined}
					aria-disabled={disabled}
					aria-describedby={describedBy}
				>
					{children}
				</select>

				<i className="bi bi-chevron-down" aria-hidden="true"></i>
			</div>
		</div>
	);
}
