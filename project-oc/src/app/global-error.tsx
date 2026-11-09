"use client";

import Link from "next/link";
import styles from "./global-error.module.css";
import {ActionButton} from "@/components/ui/button";
import {ErrorInfo} from "next/error";

export default function GlobalError({retry}: ErrorInfo) {
	return (
		<html lang="ko">
			<body className={styles.body}>
				<meta name="robots" content="noindex, noai, noimageai" />
				<title>잠시 문제가 생겼습니다. 죄송합니다! - 프로젝트 OC</title>

				<main className={styles.main}>
					<section className={styles.copy}>
						<p className={styles.title}>이런&nbsp;!</p>

						<h1>잠시 문제가 생겼습니다.</h1>

						<p>페이지를 불러오지 못했습니다. 죄송합니다!{"\n"}잠시 후 다시 시도해 주세요.</p>

						<div className={styles.actions}>
							<ActionButton className={styles.retry} width="auto" style={{padding: "0 22px"}} styleType="attention" onClick={retry}>
								다시 시도
							</ActionButton>

							<Link href="/" className={styles.home}>
								홈으로
							</Link>
						</div>
					</section>

					<div className={styles.visual} aria-hidden="true">
						<div className={styles.shape}>ERROR</div>
					</div>
				</main>
			</body>
		</html>
	);
}
