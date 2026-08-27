"use client";

import {useEffect, useId, useState} from "react";
import styles from "./ThemeSelect.module.css";

type ThemeType = "auto" | "light" | "dark";

export default function ThemeSelect() {
	const [menuOpen, setMenuOpen] = useState<boolean>(false);

	const [currentTheme, setCurrentTheme] = useState<ThemeType>("auto");

	const [isMounted, setIsMounted] = useState(false);

	const menuId = useId();

	const displayTheme = !isMounted ? "auto" : currentTheme;

	const THEME_NAME = {
		auto: "자동",
		light: "밝게",
		dark: "어둡게",
	} as const;

	const THEME_ICON = {
		auto: "bi-cloud-sun",
		light: "bi-sun",
		dark: "bi-moon",
	} as const;

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsMounted(true);

		const savedTheme = localStorage.getItem("color-theme") as ThemeType;
		if (savedTheme) {
			setCurrentTheme(savedTheme);
		}
	}, []);

	const themeChange = (value: "auto" | "light" | "dark") => {
		setCurrentTheme(value);
		localStorage.setItem("color-theme", value);

		setMenuOpen(false);
	};

	const themeList = (
		<ul id={menuId} role="menu" aria-orientation="vertical">
			<li role="none">
				<label role="menuitem">
					<input type="radio" name="color-theme" checked={currentTheme === "auto"} hidden value="auto" onChange={() => themeChange("auto")} />
					자동
				</label>
			</li>

			<li role="none">
				<label role="menuitem">
					<input type="radio" name="color-theme" checked={currentTheme === "light"} hidden value="light" onChange={() => themeChange("light")} />
					밝게
				</label>
			</li>

			<li role="none">
				<label role="menuitem">
					<input type="radio" name="color-theme" checked={currentTheme === "dark"} hidden value="dark" onChange={() => themeChange("dark")} />
					어둡게
				</label>
			</li>
		</ul>
	);

	return (
		<div className={styles.theme}>
			<button type="button" aria-haspopup="menu" aris-expended={String(menuOpen)} aria-controls={menuId} aria-label="테마 선택" onClick={() => setMenuOpen((prev) => !prev)}>
				<span className={styles.pc}>{THEME_NAME[displayTheme]}</span>

				<i className={`${styles.mobile} bi ${THEME_ICON[displayTheme]}`}></i>

				<span>▼</span>
			</button>

			{menuOpen ? themeList : null}
		</div>
	);
}
