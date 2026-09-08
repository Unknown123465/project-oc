"use client";

import styles from "./HeaderMenu.module.css";
import Link from "next/link";
import ThemeSelect from "./ThemeSelect";

export default function UserMenu() {
	return (
		<div className={styles.menu} aria-label="주요 메뉴">
			<Link href="/" className={styles.text}>
				프로필 둘러보기
			</Link>

			<Link href="/create" className={styles.text}>
				프로필 만들기
			</Link>

			<Link href="/my" className={styles.text}>
				내 캐릭터
			</Link>

			<Link href="/setting" className={styles.text}>
				계정 설정
			</Link>

			<Link href="/logout" className={`${styles.text} ${styles.danger}`}>
				로그아웃
			</Link>

			<ThemeSelect />
		</div>
	);
}
