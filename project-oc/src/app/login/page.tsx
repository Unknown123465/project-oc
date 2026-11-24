import {LoginForm} from "./client";
import styles from "./page.module.css";
import AuthAside from "../_components/auth/AuthAside";
import SocialLoginList from "../_components/login/SocialLoginList";
import {auth} from "@/auth/auth";
import {redirect} from "next/navigation";
import Link from "next/link";
import {resolveLoginRedirect} from "./validator";

export default async function Login({searchParams}: PageProps<"/login">) {
	const authInfo = await auth();

	if (authInfo !== null) {
		const query = await searchParams;

		const redirectResult = resolveLoginRedirect(query);

		return redirect(redirectResult.success ? redirectResult.result : "/", "replace");
	}

	return (
		<main className={styles.main}>
			<AuthAside title={`어서 와요.\n캐릭터가 기다리고 있어요.`} description="쓰다 만 프로필을 이어서 쓰고, 그동안 달린 좋아요와 코멘트를 확인해 보세요." />

			<section className={styles.form_area}>
				<article className={styles.form_box}>
					<h2>로그인</h2>

					<p className={styles.lead}>계속하려면 로그인해 주세요.</p>

					<LoginForm />

					<div className={styles.divider}>
						<span>또는</span>
					</div>

					<SocialLoginList />

					<div className={styles.sub_links}>
						<Link href="/resetpw">비밀번호를 잊으셨나요?</Link>

						<Link href="/signup">처음이신가요?</Link>
					</div>
				</article>
			</section>
		</main>
	);
}
