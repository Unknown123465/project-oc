"use client";

import styles from "./ThemeSelect.module.css";

export default function ThemeSelect() {
	const themeList = (
		<ul role="menu">
			<li role="none">
				<label role="menuitem">
					<input type="radio" name="color-theme" hidden value="auto" />
					자동
				</label>
			</li>

			<li role="none">
				<label role="menuitem">
					<input type="radio" name="color-theme" hidden value="light" />
					밝게
				</label>
			</li>

			<li role="none">
				<label role="menuitem">
					<input type="radio" name="color-theme" hidden value="dark" />
					어둡게
				</label>
			</li>
		</ul>
	);

	return (
		<div className={styles.theme}>
			<button type="button" aria-haspopup="menu" aris-expended="true" aria-controls="">
				<span className={styles.pc}>밝게</span>
				<span className={styles.mobile}>
					<i className="bi bi-sun"></i>
				</span>
			</button>

			{true ? themeList : null}
		</div>
	);
}
