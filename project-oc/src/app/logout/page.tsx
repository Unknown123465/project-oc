"use client";

import {useEffect} from "react";
import {signOut, useSession} from "next-auth/react";
import {useRouter} from "next/navigation";
import styles from "./page.module.css";

/* 세션 상태마다 바뀌는 건 문구뿐이라 판과 아이콘은 하나로 둔다. */
const MESSAGES = {
	loading: {title: "로그인 상태를 확인하는 중이에요", description: "잠시만 기다려 주세요."},
	authenticated: {title: "로그아웃하는 중이에요", description: "끝나면 메인 화면으로 이동해요."},
	unauthenticated: {title: "이미 로그아웃되어 있어요", description: "메인 화면으로 이동해요."},
} as const;

export default function Logout() {
	const session = useSession();

	const router = useRouter();

	const logout = async () => {
		await signOut({
			redirectTo: "/",
		});
	};

	useEffect(() => {
		if (session.status === "authenticated") {
			logout();
		} else if (session.status === "unauthenticated") {
			router.replace("/");
		}
	}, [session.status]);

	const message = MESSAGES[session.status];

	/* 로그아웃 도중 다른 페이지로 가지 않도록 헤더와 푸터를 숨긴다(globals.css의 data-no-* 규칙). */
	return (
		<main className={styles.main} data-no-header data-no-footer>
			<section className={styles.panel} aria-live="polite">
				<div className={styles.mark} aria-hidden="true">
					<i className="bi bi-box-arrow-right"></i>
				</div>

				<h1>{message.title}</h1>

				<p>{message.description}</p>
			</section>
		</main>
	);
}
