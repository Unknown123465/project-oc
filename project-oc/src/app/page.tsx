import Image from "next/image";
import styles from "./page.module.css";
import Link from "next/link";
import {ReactNode} from "react";

function Header() {
	return (
		<article className={styles.header}>
			<p className={styles.small_title}>자작 캐릭터 프로필 메이커</p>

			<h1>
				캐릭터의 핵심만,
				<br />한 장에.
			</h1>

			<p className={styles.detail_title}>몇 가지 정보만 적으면 읽기 쉽고 공유하기 좋은 캐릭터 프로필이 바로 완성됩니다.</p>

			<div className={styles.buttons}>
				<Link href="/">프로필 만들기</Link>

				<Link href="/">완성된 프로필 보기</Link>
			</div>
		</article>
	);
}

export default function Page() {
	return (
		<main className={styles.main}>
			<Header />
		</main>
	);
}
