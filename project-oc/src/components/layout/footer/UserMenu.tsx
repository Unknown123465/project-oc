"use client";

import styles from "./FooterMenu.module.css";
import Link from "next/link";

export default function UserMenu() {
	return (
		<div className={styles.menu}>
			<Link href="/">프로필 둘러보기</Link>

			<Link href="/create">프로필 만들기</Link>

			<Link href="/setting">걔정 설정</Link>

			<a href="/lincese" target="_blank" rel="noreferrer noopener">
				오픈소스 라이선스
			</a>
		</div>
	);
}
