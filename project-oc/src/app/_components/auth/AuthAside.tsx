import type {ReactNode} from "react";
import styles from "./AuthAside.module.css";

interface AuthAsideProps {
	title: ReactNode;
	description: string;
}

/** 로그인 / 회원가입이 공유하는 브랜드 패널. 문구만 페이지마다 다르다. */
export default function AuthAside({title, description}: AuthAsideProps) {
	return (
		<section className={styles.aside}>
			<h1>{title}</h1>

			<p>{description}</p>
		</section>
	);
}
