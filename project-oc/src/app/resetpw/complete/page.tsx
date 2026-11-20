import type {Metadata} from "next";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
/* 비밀번호 변경 완료 페이지와 같은 화면이라 CSS도 같이 쓴다. */
import styles from "../../setting/changepw/page.module.css";
import SuccessMark from "@/app/_components/signup/complete/SuccessMark";
import {LinkButton} from "@/components/ui/button";
import {RESET_PASSWORD_COMPLETE_COOKIE} from "../completeCookie";

export const metadata: Metadata = {
	title: "비밀번호를 바꿨어요 - 프로젝트 OC",
	robots: "noindex",
};

/* 비밀번호 변경 완료 페이지와 같은 방식이다. 재설정 액션이 심어 준 쿠키가 있을 때만 열고,
   주소만 알고 들어오면 메인으로 보낸다. 재설정은 로그아웃 상태에서만 하므로 세션은 보지 않는다. */
export default async function ResetPasswordComplete() {
	const cookieStore = await cookies();

	if (!cookieStore.has(RESET_PASSWORD_COMPLETE_COOKIE)) {
		return redirect("/", "replace");
	}

	return (
		<main className={styles.main}>
			<h1>비밀번호 재설정</h1>

			<section className={styles.panel} aria-labelledby="reset-password-complete-title">
				<SuccessMark />

				<h2 id="reset-password-complete-title">비밀번호를 바꿨어요</h2>

				<p className={styles.lead}>모든 기기에서 로그아웃됐어요. 새 비밀번호로 다시 로그인해 주세요.</p>

				<div className={styles.actions}>
					<LinkButton href="/login">로그인</LinkButton>

					<LinkButton href="/" styleType="simple">
						홈으로
					</LinkButton>
				</div>
			</section>
		</main>
	);
}
