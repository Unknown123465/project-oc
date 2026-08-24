"use client";

import styles from "./HeaderMenu.module.css";
import Link from "next/link";

export default function GuestMenu() {
	return (
		<div className={styles.menu}>
			<Link href="/" className={styles.text}>
				프로필 둘러보기
			</Link>

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
