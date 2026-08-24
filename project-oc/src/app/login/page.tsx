import Form from "next/form";
import {LoginForm} from "./client";
import styles from "./page.module.css";
import {googleLoginAction, kakaoLoginAction, naverLoginAction, twitterLoginAction} from "./action";
import {SubmitButton} from "../component/ui/button";
import {auth} from "../../auth/auth";
import {redirect} from "next/navigation";

function BgCircle({size, boundary, fill, pos}: {size: "big" | "small"; boundary: "soft" | "hard"; fill: "bg" | "stroke"; pos: "left" | "middle" | "right"}) {
	const classList: string[] = [];

	if (size === "big") {
		classList.push(styles.big);
	} else {
		classList.push(styles.small);
	}

	if (boundary === "soft") {
		classList.push(styles.soft);
	} else {
		classList.push(styles.hard);
	}

	if (fill === "bg") {
		classList.push(styles.fill_bg);
	} else {
		classList.push(styles.fill_stroke);
	}

	if (pos === "left") {
		classList.push(styles.left);
	} else if (pos === "right") {
		classList.push(styles.right);
	} else {
		classList.push(styles.top);
	}

	return <div className={`${styles.circle} ${classList.join(" ")}`}></div>;
}

function BgLeft() {
	return (
		<article className={`${styles.bg} ${styles.left}`}>
			<BgCircle size="big" boundary="soft" fill="bg" pos="left" />
			<BgCircle size="small" boundary="hard" fill="stroke" pos="left" />
		</article>
	);
}

function BgRight() {
	return <article className={`${styles.bg} ${styles.right}`}></article>;
}

function Header() {
	return (
		<section className={styles.header}>
			<h1>
				프로젝트OC
				<br />
				로그인
			</h1>

			<h2>다시 오신 것을 환영합니다! 창작할 준비가 되셨나요?</h2>
		</section>
	);
}

export default async function Login() {
	const authInfo = await auth();

	if (authInfo !== null) {
		return redirect("/", "replace");
	}

	return (
		<main className={styles.main}>
			<BgLeft />

			<section></section>

			<article>
				<Header />

				<hr />

				<LoginForm />

				<Form action={googleLoginAction}>
					<SubmitButton width="100%">구글로 로그인</SubmitButton>
				</Form>

				<Form action={naverLoginAction}>
					<SubmitButton width="100%">네이버로 로그인</SubmitButton>
				</Form>

				<Form action={kakaoLoginAction}>
					<SubmitButton width="100%">카카오로 로그인</SubmitButton>
				</Form>

				<Form action={twitterLoginAction}>
					<SubmitButton width="100%">X(twitter)로 로그인</SubmitButton>
				</Form>
			</article>

			<section></section>

			<BgRight />
		</main>
	);
}
