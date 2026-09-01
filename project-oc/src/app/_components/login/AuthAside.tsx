import styles from "./AuthAside.module.css";

export default function AuthAside() {
	return (
		<section className={styles.aside}>
			<h1>
				다시 만난
				<br />
				당신의 캐릭터.
			</h1>

			<p>작성하던 프로필을 이어서 완성하고, 독자에게 도착한 좋아요와 코멘트를 확인하세요.</p>
		</section>
	);
}
