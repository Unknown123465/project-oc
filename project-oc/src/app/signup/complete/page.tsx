import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import styles from "./page.module.css";
import AuthAside from "../../_components/auth/AuthAside";
import {LinkButton} from "@/components/ui/button";
import {auth} from "@/auth/auth";
import {SIGNUP_COMPLETE_COOKIE} from "../completeCookie";

export default async function SignupComplete() {
	const [authInfo, cookieStore] = await Promise.all([auth(), cookies()]);

	/* 가입 액션이 심어 준 표시가 있을 때만 연다. 주소만 알고 찾아온 사람에게는
	   완료할 가입이 없다. 세션까지 같이 보는 이유는 쿠키가 남은 채로 로그아웃한
	   상태에서 들어오면 완료를 알릴 계정이 없기 때문이다. */
	if (authInfo === null || !cookieStore.has(SIGNUP_COMPLETE_COOKIE)) {
		//TODO: 내 캐릭터 페이지 완성 시 해당 페이지로 리다이렉트 되게 구현 할 예정
		return redirect("/", "replace");
	}

	const userName = authInfo.user?.name;

	return (
		<main className={styles.main}>
			<AuthAside title={`환영합니다.\n이제 만들 차례.`} description="계정이 만들어졌습니다. 프로필 한 장이면 당신의 캐릭터를 소개할 준비가 끝납니다." />

			<section className={styles.result_area}>
				<article className={styles.result_box}>
					<div className={styles.check} aria-hidden="true">
						<i className="bi bi-check-lg"></i>
					</div>

					<h2>가입이 완료되었습니다</h2>

					<p className={styles.lead}>{userName ? `${userName}님, 프로젝트 OC에 오신 것을 환영합니다.` : "프로젝트 OC에 오신 것을 환영합니다."}</p>

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
