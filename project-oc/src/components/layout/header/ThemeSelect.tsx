"use client";

import {useEffect, useId, useState} from "react";
import styles from "./ThemeSelect.module.css";

type ThemeType = "auto" | "light" | "dark";

export default function ThemeSelect() {
	const [menuOpen, setMenuOpen] = useState<boolean>(false);

	const [currentTheme, setCurrentTheme] = useState<ThemeType>("auto");

	const menuId = useId();

	useEffect(() => {
		const waitTimer = setTimeout(() => {
			const savedTheme = localStorage.getItem("color-theme") as ThemeType;

			if (savedTheme && savedTheme !== "auto") {
				setCurrentTheme(savedTheme);
			}
		}, 0);

		return () => {
			clearTimeout(waitTimer);
		};
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
				<span className={styles.pc}>밝게</span>
				<span className={styles.mobile}>
					<i className="bi bi-sun"></i>
				</span>

				<span>▼</span>
			</button>

			{true ? themeList : null}
		</div>
	);
}
