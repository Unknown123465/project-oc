"use client";

import styles from "./FooterMenu.module.css";
import Link from "next/link";

export default function GuestMenu() {
	return (
		<div className={styles.menu}>
			<Link href="/login">로그인</Link>

			<Link href="/signup">회원가입</Link>

			<Link href="/termsofuse">이용 정책</Link>

			<Link href="/privacy">개인정보 처리방침</Link>

			<a href="/license" target="_blank" rel="noreferrer noopener">
				오픈소스 라이선스
			</a>
		</div>
	);
}
