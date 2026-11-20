import Link from "next/link";
import {redirect} from "next/navigation";
/* 회원가입 페이지와 같은 배치라 CSS도 같이 쓴다. */
import styles from "../signup/page.module.css";
import AuthAside from "../_components/auth/AuthAside";
import ResetPasswordRequestForm from "../_components/resetpw/ResetPasswordRequestForm";
import {auth} from "@/auth/auth";
import {PASSWORD_RESET_TOKEN_MINUTES} from "@/auth/verificationToken";

export default async function ResetPasswordRequestPage() {
	const authInfo = await auth();

	/* 로그인한 사람은 계정 설정에서 비밀번호를 바꾸면 된다. */
	if (authInfo !== null) {
		return redirect("/setting/changepw", "replace");
	}

	return (
		<main className={styles.main}>
			<AuthAside title={`비밀번호를\n잊어버렸어요?`} description="가입할 때 쓴 이메일 주소로 재설정 링크를 보내 드려요. 링크에서 새 비밀번호를 정하면 돼요." />

			<section className={styles.form_area}>
				<article className={styles.form_box}>
					<h2>비밀번호 재설정</h2>

					<p className={styles.lead}>가입할 때 쓴 이메일 주소와 사용자 이름을 적어 주세요.</p>

					<ResetPasswordRequestForm expiresMinutes={PASSWORD_RESET_TOKEN_MINUTES} />

					<p className={styles.terms}>소셜 로그인으로 가입한 계정은 재설정할 수 없어요.</p>

					<div className={styles.sub_links}>
						<Link href="/login">로그인으로 돌아가기</Link>
					</div>
				</article>
			</section>
		</main>
	);
}
