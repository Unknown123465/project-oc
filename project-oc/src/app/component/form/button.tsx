"use client";

import type {CSSProperties, ReactNode} from "react";
import styles from "./styles.module.css";
import Link from "next/link";
import {useFormStatus} from "react-dom";

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
			style={{width, height, ...style}}>
			{children}
		</button>
	);
}

interface SubmitButtonProps extends ButtonProps {
	styleType?: "simple" | "attention";
	pendingChildren?: ReactNode | undefined;
	disabledIfPending?: boolean;
}

export function SubmitButton({children, pendingChildren, className, width, height, style, hoverAnimation = true, disabled, disabledIfPending = false, styleType = "attention"}: SubmitButtonProps) {
	const formStatus = useFormStatus();

	return (
		<button
			type="submit"
			className={`${styles.button} ${styles.submit} ${styleType === "attention" ? styles.attention : ""} ${hoverAnimation ? styles.normal_button : ""} ${className}`}
			disabled={disabled || (disabledIfPending && formStatus.pending)}
			aria-disabled={disabled || (disabledIfPending && formStatus.pending)}
			style={{width, height, ...style}}>
			{formStatus.pending && pendingChildren !== undefined ? pendingChildren : children}
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
	styleType?: "simple" | "attention";
}

export function LinkButton({children, href, className, width, height, style, styleType = "attention"}: LinkButtonProps) {
	return (
		<Link href={href} className={`${styles.anchor} ${styleType === "attention" ? styles.attention : ""} ${className}`} role="button" style={{width, height, ...style}}>
			{children}
		</Link>
	);
}
