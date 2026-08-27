"use client";

import styles from "./HeaderMenu.module.css";
import Link from "next/link";
import ThemeSelect from "./ThemeSelect";

export default function GuestMenu() {
	return (
		<div className={styles.menu} aria-label="주요 메뉴">
			<Link href="/" className={styles.text}>
				프로필 둘러보기
			</Link>

			<ThemeSelect />

			<div className={styles.buttons}>
				<Link href="/login" className={styles.white}>
					로그인
				</Link>

				<Link href="/join" className={styles.yellow}>
					회원가입
				</Link>
			</div>
		</div>
	);
}
