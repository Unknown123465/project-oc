import type {Metadata} from "next";
import Link from "next/link";
import {redirect, unauthorized} from "next/navigation";
import styles from "./page.module.css";
import ChangePasswordForm from "@/app/_components/setting/ChangePasswordForm";
import {getMyAccountInfo} from "../getAccountInfo";

/* 로그인한 본인만 쓰는 페이지라 검색에 노출하지 않는다. */
export const metadata: Metadata = {
	title: "비밀번호 변경 - 프로젝트 OC",
	robots: "noindex",
};

export default async function ChangePasswordPage() {
	const accountInfo = await getMyAccountInfo();

	if (!accountInfo.success) {
		unauthorized();
	}

	/* 소셜 가입자는 비밀번호가 없다. 설정 화면에서 이 페이지로 오는 버튼도 숨겨 두었다. */
	if (accountInfo.result.socialProvider !== "일반") {
		return redirect("/setting", "replace");
	}

	return (
		<main className={styles.main}>
			<Link href="/setting" className={styles.back}>
				<i className="bi bi-arrow-left" aria-hidden="true"></i>
				계정 설정
			</Link>

			<h1>비밀번호 변경</h1>

			<section className={styles.panel} aria-labelledby="change-password-title">
				<h2 id="change-password-title">새 비밀번호 정하기</h2>

				<p className={styles.lead}>바꾸고 나면 지금 이 브라우저를 포함해 모든 기기에서 로그아웃돼요.{"\n"}새 비밀번호로 다시 로그인해 주세요.</p>

				<ChangePasswordForm userName={accountInfo.result.username} />
			</section>
		</main>
	);
}
