"use client"

import styles from "./HeaderMenu.module.css";
import Link from "next/link";

export default function UserMenu() {
	return (
		<div className={styles.menu}>
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
		</div>
	);
}
