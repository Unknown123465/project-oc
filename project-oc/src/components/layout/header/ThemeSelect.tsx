"use client";

import {useEffect, useId, useRef, useState} from "react";
import styles from "./ThemeSelect.module.css";

type ThemeType = "auto" | "light" | "dark";

const THEME_NAME = {
	auto: "자동",
	light: "밝은",
	dark: "어두운",
} as const;

const THEME_ICON = {
	auto: styles.auto,
	light: "bi-sun",
	dark: "bi-moon",
} as const;

export default function ThemeSelect() {
	const [menuOpen, setMenuOpen] = useState<boolean>(false);

	const [currentTheme, setCurrentTheme] = useState<ThemeType>(
		(() => {
			if (typeof document === "undefined") {
				return "auto";
			} else {
				return (document.documentElement.dataset.theme as ThemeType) || "auto";
			}
		})(),
	);

	const themeRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	const menuId = useId();

	useEffect(() => {
		if (menuOpen) {
			const abort: AbortController = new AbortController();

			document.addEventListener(
				"keydown",
				(e) => {
					if (e.key === "Escape") {
						setMenuOpen(false);
					}
				},
				{signal: abort.signal},
			);

			document.addEventListener(
				"pointerdown",
				(e) => {
					if (!themeRef.current?.contains(e.target as Node)) {
						setMenuOpen(false);
					}
				},
				{signal: abort.signal},
			);

			return () => {
				abort.abort();
			};
		}
	}, [menuOpen]);

	const themeChange = (value: "auto" | "light" | "dark") => {
		setCurrentTheme(value);
		localStorage.setItem("color-theme", value);

		setMenuOpen(false);

		if (value === "auto") {
			document.documentElement.removeAttribute("data-theme");
		} else {
			document.documentElement.setAttribute("data-theme", value);
		}
	};

	return (
		<div className={styles.theme} ref={themeRef}>
			<button
				type="button"
				className={menuOpen ? styles.open : undefined}
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				aria-controls={menuId}
				aria-label="테마 선택"
				ref={buttonRef}
				onClick={() => setMenuOpen((prev) => !prev)}>
				<i className={`${styles.pc} bi ${THEME_ICON[currentTheme]}`}></i>

				<span className={styles.mobile}>{THEME_NAME[currentTheme]} 테마</span>

				<i className={`${styles.mobile} bi bi-caret-down-fill ${menuOpen ? styles.rotate : ""}`} aria-hidden="true"></i>
			</button>

			<ul id={menuId} hidden={!menuOpen} role="radiogroup" aria-orientation="vertical">
				<li>
					<label>
						<input type="radio" name="color-theme" checked={currentTheme === "auto"} value="auto" onChange={() => themeChange("auto")} />
						자동
					</label>
				</li>

				<li role="none">
					<label role="menuitem">
						<input type="radio" name="color-theme" checked={currentTheme === "light"} value="light" onChange={() => themeChange("light")} />
						밝게
					</label>
				</li>

				<li role="none">
					<label role="menuitem">
						<input type="radio" name="color-theme" checked={currentTheme === "dark"} value="dark" onChange={() => themeChange("dark")} />
						어둡게
					</label>
				</li>
			</ul>
		</div>
	);
}
