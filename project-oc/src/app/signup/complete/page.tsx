import styles from "./page.module.css";
import AuthAside from "../../_components/auth/AuthAside";
import {LinkButton} from "@/components/ui/button";

export default function SignupComplete() {
	return (
		<main className={styles.main}>
			<AuthAside title={`환영합니다.\n이제 만들 차례.`} description="계정이 만들어졌습니다. 프로필 한 장이면 당신의 캐릭터를 소개할 준비가 끝납니다." />

			<section className={styles.result_area}>
				<article className={styles.result_box}>
					<div className={styles.check} aria-hidden="true">
						<i className="bi bi-check-lg"></i>
					</div>

					<h2>가입이 완료되었습니다</h2>

					<p className={styles.lead}>프로젝트 OC에 오신 것을 환영합니다.</p>

					<p className={styles.note}>이름과 몇 가지 설정만 채우면 첫 번째 캐릭터 프로필이 완성됩니다. 지금 만들지 않아도 언제든 다시 시작할 수 있습니다.</p>

					<div className={styles.actions}>
						<LinkButton href="/create">프로필 만들기</LinkButton>

						<LinkButton href="/" styleType="simple">
							홈으로
						</LinkButton>
					</div>
				</article>
			</section>
		</main>
	);
}
