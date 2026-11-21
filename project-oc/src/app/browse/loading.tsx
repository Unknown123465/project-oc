import pageStyles from "./page.module.css";
import styles from "../mylist/loading.module.css";

/* 첫 줄과 둘째 줄까지만 그린다. 뼈대 모양은 /mylist 로딩 화면과 같다. */
const SKELETON_TILE_COUNT = 8 as const;

export default function Loading() {
	return (
		<main className={`${pageStyles.main} ${styles.main}`} aria-busy="true">
			<div className={styles.heading} role="status" aria-label="프로필 목록을 불러오는 중이에요.">
				<div className={styles.title} />

				<div className={styles.count} />
			</div>

			<div className={styles.toolbar} aria-hidden="true" />

			<ul className={pageStyles.grid} aria-hidden="true">
				{Array.from({length: SKELETON_TILE_COUNT}, (_, index) => (
					<li key={index} className={styles.tile}>
						<div />

						<div />
					</li>
				))}
			</ul>
		</main>
	);
}
