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
		return redirect("/", "replace");
	}

	return (
		<main className={styles.main}>
			<AuthAside title={`몇 가지만 적으면\n프로필 완성.`} description="프로젝트 OC에 가입하고 첫 번째 캐릭터 프로필을 만들어 보세요. 기본 기능은 무료입니다." />

			<section className={styles.form_area}>
				<article className={styles.form_box}>
					<h2>회원가입</h2>

					<p className={styles.lead}>당신의 캐릭터를 소개할 준비를 시작합니다.</p>

					<SignupForm />

					<p className={styles.terms}>가입하면 프로젝트 OC의 이용 정책과 개인정보 처리방침에 동의하게 됩니다.</p>

					<div className={styles.sub_links}>
						<Link href="/login">이미 계정이 있으신가요?</Link>
					</div>
				</article>
			</section>
		</main>
	);
}
