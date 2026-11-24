import Link from "next/link";
import {redirect} from "next/navigation";
import styles from "./page.module.css";
import AuthAside from "../_components/auth/AuthAside";
import SignupForm from "../_components/signup/SignupForm";
import {auth} from "@/auth/auth";

export default async function Signup() {
	const authInfo = await auth();

	/* 이미 로그인한 사용자에게 가입 폼을 보여 줄 이유가 없다. 로그인 페이지와 같은 처리. */
	if (authInfo !== null) {
		return redirect("/mylist?page=1", "replace");
	}

	return (
		<main className={styles.main}>
			<AuthAside title={`가입하고\n첫 프로필을 만들어 봐요.`} description="가입은 금방 끝나요. 프로필 만들기와 공유는 무료예요." />

			<section className={styles.form_area}>
				<article className={styles.form_box}>
					<h2>회원가입</h2>

					<p className={styles.lead}>가입하면 바로 프로필을 만들 수 있어요.</p>

					<SignupForm />

					<p className={styles.terms}>
						가입하면 프로젝트 OC의{" "}
						<Link href="/termsofuse" target="_blank" rel="noreferrer noopener">
							이용 정책
						</Link>
						과{" "}
						<Link href="/privacy" target="_blank" rel="noreferrer noopener">
							개인정보 처리방침
						</Link>
						에 동의하게 됩니다.
					</p>

					<div className={styles.sub_links}>
						<Link href="/login">이미 계정이 있으신가요?</Link>
					</div>
				</article>
			</section>
		</main>
	);
}
