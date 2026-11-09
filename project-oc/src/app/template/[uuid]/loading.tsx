import styles from "./loading.module.css";

export default function Loading() {
	return (
		<main className={styles.main} aria-busy="true" data-no-footer>
			<div className={styles.sheet} role="status" aria-label="프로필을 불러오는 중입니다.">
				<div className={styles.cover} />

				<div className={styles.inner} aria-hidden="true">
					<div className={styles.name} />

					<div className={styles.message} />

					<div className={styles.facts}>
						<div />

						<div />

						<div />

						<div />
					</div>

					<div className={styles.block} />
				</div>
			</div>
		</main>
	);
}
