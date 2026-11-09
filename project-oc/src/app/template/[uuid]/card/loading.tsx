import styles from "./loading.module.css";

export default function Loading() {
	return (
		<main className={styles.main} data-no-header data-no-footer aria-busy="true">
			<div className={styles.card} role="status" aria-label="프로필 카드를 불러오는 중입니다." />

			<div className={styles.footer} aria-hidden="true">
				<div />

				<div />
			</div>
		</main>
	);
}
