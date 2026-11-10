"use client";

import type {AriaAttributes, CSSProperties, ReactNode} from "react";
import styles from "./styles.module.css";
import Link from "next/link";

interface ButtonProps {
	children: ReactNode;
	className?: string;
	width?: number | string;
	height?: number | string;
	style?: CSSProperties;
	hoverAnimation?: boolean;
	disabled?: boolean;
}

export function NormalButton({children, className, width, height, style, hoverAnimation = true, disabled}: ButtonProps) {
	return (
		<button
			type="button"
			className={`${styles.button} ${styles.normal} ${hoverAnimation ? styles.hover_animation : ""} ${className}`}
			disabled={disabled}
			aria-disabled={disabled}
			style={{width, height, ...style}}
		>
			{children}
		</button>
	);
}

interface SubmitButtonProps extends ButtonProps {
	styleType?: "simple" | "attention" | "danger";
}

export function SubmitButton({children, className, width, height, style, hoverAnimation = true, disabled, styleType = "attention"}: SubmitButtonProps) {
	return (
		<button
			type="submit"
			className={`${styles.button} ${styles.submit} ${styleType === "simple" ? "" : styles[styleType]} ${hoverAnimation ? styles.normal_button : ""} ${className}`}
			disabled={disabled}
			aria-disabled={disabled}
			style={{width, height, ...style}}
		>
			{children}
		</button>
	);
}

interface ActionButtonProps extends ButtonProps {
	onClick?: () => void;
	styleType?: "normal" | "attention" | "danger";
	/** 누르면 다이얼로그가 열리는 버튼(공유, 삭제 확인)은 "dialog"를 넘겨 화면 낭독기에 알린다. */
	ariaHasPopup?: AriaAttributes["aria-haspopup"];
}

/* NormalButton은 onClick을 받지 않고 SubmitButton은 type="submit"으로 고정돼
   있어, form 안에 떠 있는 다이얼로그의 취소·적용 같은 동작에는 못 쓴다(제출
   타입을 쓰면 다이얼로그를 감싼 바깥 form까지 함께 제출돼 버린다). 색은
   NormalButton·SubmitButton과 같은 클래스를 그대로 가져와 맞춘다. */
export function ActionButton({children, className, width, height, style, hoverAnimation = true, disabled, onClick, styleType = "normal", ariaHasPopup}: ActionButtonProps) {
	return (
		<button
			type="button"
			className={`${styles.button} ${styleType === "normal" ? styles.normal : `${styles.submit} ${styles[styleType]}`} ${hoverAnimation ? styles.hover_animation : ""} ${className ?? ""}`}
			disabled={disabled}
			aria-disabled={disabled}
			onClick={onClick}
			aria-haspopup={ariaHasPopup}
			style={{width, height, ...style}}
		>
			{children}
		</button>
	);
}

interface LinkButtonProps {
	children: ReactNode;
	href: string;
	className?: string;
	width?: number | string;
	height?: number | string;
	style?: CSSProperties;
	styleType?: "simple" | "attention" | "danger";
}

export function LinkButton({children, href, className, width, height, style, styleType = "attention"}: LinkButtonProps) {
	return (
		<Link href={href} className={`${styles.anchor} ${styleType === "simple" ? "" : styles[styleType]} ${className}`} role="button" style={{width, height, ...style}}>
			{children}
		</Link>
	);
}
