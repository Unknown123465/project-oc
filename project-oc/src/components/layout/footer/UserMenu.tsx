"use client";

import styles from "./FooterMenu.module.css";
import Link from "next/link";

export default function UserMenu() {
	return (
		<div className={styles.menu}>
			<Link href="/browse?page=1">프로필 둘러보기</Link>

			<Link href="/create">프로필 만들기</Link>

			<Link href="/setting">계정 설정</Link>

			<Link href="/termsofuse">이용 정책</Link>

			<Link href="/privacy">개인정보 처리방침</Link>

			<a href="/license" target="_blank" rel="noreferrer noopener">
				오픈소스 라이선스
			</a>
		</div>
	);
}
