import styles from "./CtaSection.module.css";
import Link from "next/link";

export default function CtaSection() {
	return (
		<article className={styles.cta}>
			<section>
				<b>
					당신의 캐릭터를
					<br />
					가볍게 소개해 보세요.
				</b>

				<Link href="/login">무료로 시작하기</Link>
			</section>
		</article>
	);
}
