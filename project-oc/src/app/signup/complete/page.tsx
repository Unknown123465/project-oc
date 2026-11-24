import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import styles from "./page.module.css";
import AuthAside from "../../_components/auth/AuthAside";
import SuccessMark from "../../_components/signup/complete/SuccessMark";
import CompleteActions from "../../_components/signup/complete/CompleteActions";
import {auth} from "@/auth/auth";
import {SIGNUP_COMPLETE_COOKIE} from "../completeCookie";

export default async function SignupComplete() {
	const [authInfo, cookieStore] = await Promise.all([auth(), cookies()]);

	/* 가입 액션이 심어 준 표시가 있을 때만 연다. 주소만 알고 찾아온 사람에게는
	   완료할 가입이 없다. 세션까지 같이 보는 이유는 쿠키가 남은 채로 로그아웃한
	   상태에서 들어오면 완료를 알릴 계정이 없기 때문이다. */
	if (authInfo === null) {
		return redirect("/", "replace");
	} else if (!cookieStore.has(SIGNUP_COMPLETE_COOKIE)) {
		return redirect("/mylist?page=1", "replace");
	}

	const userName = authInfo.user?.name;

	return (
		<main className={styles.main}>
			<AuthAside title={`가입 끝!\n이제 자캐를 소개해 봐요.`} description="계정이 만들어졌어요. 프로필 한 장만 만들면 바로 공유할 수 있어요." />

			<section className={styles.result_area}>
				<article className={styles.result_box}>
					<SuccessMark />

					<h2>가입이 끝났어요</h2>

					<p className={styles.lead}>{userName ? `${userName}님, 반가워요.` : "반가워요."}</p>

					<p className={styles.note}>이름과 몇 가지만 채우면 첫 프로필이 완성돼요. 지금 안 만들어도 언제든 다시 시작할 수 있어요.</p>

					<CompleteActions />
				</article>
			</section>
		</main>
	);
}
