import type {Metadata} from "next";
import {forbidden, unauthorized} from "next/navigation";
/* 비밀번호 변경 페이지와 같은 화면이라 CSS도 같이 쓴다. */
import styles from "@/app/setting/changepw/page.module.css";
import ResetPasswordForm from "@/app/_components/resetpw/ResetPasswordForm";
import {auth} from "@/auth/auth";
import {getPasswordResetRequest} from "@/auth/verificationToken";

/* 이메일 변경 확인 페이지(/auth/[token])와 같은 이유로 검색 노출과 Referer를 막는다. */
export async function generateMetadata({params}: PageProps<"/auth/resetpw/[token]">): Promise<Metadata> {
	const {token} = await params;

	const request = await getPasswordResetRequest(token);

	return {
		title: request !== null ? "비밀번호 재설정 - 프로젝트 OC" : "쓸 수 없는 링크 - 프로젝트 OC",
		robots: "noindex",
		referrer: "no-referrer",
	};
}

/* 비밀번호 재설정 메일의 링크로 들어오는 페이지. 로그아웃 상태에서만 쓸 수 있다.
   로그인한 상태면 링크가 살아 있어도 403, 쓸 수 없는 링크(만료, 이미 씀, 없는 토큰)면 401 화면을 보여 준다. */
export default async function ResetPasswordPage({params}: PageProps<"/auth/resetpw/[token]">) {
	const {token} = await params;

	const [request, authInfo] = await Promise.all([getPasswordResetRequest(token), auth()]);

	if (authInfo !== null) {
		forbidden();
	} else if (request === null) {
		unauthorized();
	}

	return (
		<main className={styles.main}>
			<h1>비밀번호 재설정</h1>

			<section className={styles.panel} aria-labelledby="reset-password-title">
				<h2 id="reset-password-title">새 비밀번호 정하기</h2>

				<p className={styles.lead}>
					{request.userName}님 계정의 비밀번호를 새로 정해요. 바꾸고 나면 모든 기기에서 로그아웃돼요.{"\n"}새 비밀번호로 다시 로그인해 주세요.
				</p>

				<ResetPasswordForm token={token} userName={request.userName} />
			</section>
		</main>
	);
}
