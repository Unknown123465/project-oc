import Form from "next/form";
import {LoginForm} from "./client";
import styles from "./page.module.css";
import {googleLoginAction, naverLoginAction, twitterLoginAction} from "./action";
import {SubmitButton} from "@/components/ui/button";
import {auth} from "@/auth/auth";
import {redirect} from "next/navigation";

export default async function Login() {
	const authInfo = await auth();

	if (authInfo !== null) {
		return redirect("/", "replace");
	}

	return (
		<main className={styles.main}>
			<section className={styles.aside}>
				<h1>
					다시 만난
					<br />
					당신의 캐릭터.
				</h1>

				<p>작성하던 프로필을 이어서 완성하고, 독자에게 도착한 좋아요와 코멘트를 확인하세요.</p>
			</section>

			<section className={styles.form_area}>
				<article className={styles.form_box}>
					<h2>로그인</h2>

					<p className={styles.lead}>다시 오신 것을 환영합니다.</p>

					<LoginForm />

					<div className={styles.divider}>
						<span>또는</span>
					</div>

					<div className={styles.social}>
						<Form action={googleLoginAction}>
							<SubmitButton styleType="simple">구글로 로그인</SubmitButton>
						</Form>

						<Form action={naverLoginAction}>
							<SubmitButton styleType="simple">네이버로 로그인</SubmitButton>
						</Form>

						<Form action={twitterLoginAction}>
							<SubmitButton styleType="simple">X(트위터)로 로그인</SubmitButton>
						</Form>
					</div>

					<div className={styles.sub_links}>
						<button type="button" disabled>
							계정을 잊으셨나요?
						</button>

						<button type="button" disabled>
							처음이신가요?
						</button>
					</div>
				</article>
			</section>
		</main>
	);
}
