import styles from "./not-found.module.css";
import {LinkButton} from "@/components/ui/button";

export default function NotFound() {
	return (
		<main className={styles.main}>
			<section className={styles.copy}>
				<p className={styles.eyebrow}>Character not found</p>

				<h1>찾고 계신 프로필이 없습니다.</h1>

				<p>캐릭터가 비공개로 전환되었거나 삭제되었을 수 있어요. 창작자의 다른 캐릭터를 찾아보는 건 어떨까요?</p>

				<div className={styles.actions}>
					<LinkButton href="/" className="" width="auto" style={{padding: "0 22px"}} styleType="attention">
						다른 캐릭터 보기
					</LinkButton>

					<LinkButton href="/" className="" width="auto" style={{padding: "0 22px"}} styleType="simple">
						홈으로
					</LinkButton>
				</div>
			</section>

			<div className={styles.visual} aria-hidden="true">
				<div className={styles.mark}>
					<span>OC</span>

					<i />

					<b>?</b>
				</div>
			</div>
		</main>
	);
}
