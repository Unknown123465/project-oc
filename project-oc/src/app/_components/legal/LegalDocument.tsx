import Link from "next/link";
import styles from "./LegalDocument.module.css";

interface LegalDocumentProps {
	title: string;
	text: string;
}

/* 이용 정책과 개인정보 처리방침이 같이 쓰는 화면. 본문은 고칠 수 없는 textarea 하나에 담는다. */
export default function LegalDocument({title, text}: LegalDocumentProps) {
	return (
		<main className={styles.main}>
			<Link href="/" className={styles.back}>
				<i className="bi bi-arrow-left" aria-hidden="true"></i>
				메인 페이지
			</Link>

			<h1>{title}</h1>

			<section className={styles.panel}>
				<textarea className={styles.text} value={text} readOnly aria-label={`${title} 본문`} />
			</section>
		</main>
	);
}
