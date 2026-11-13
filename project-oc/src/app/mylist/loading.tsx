import pageStyles from "./page.module.css";
import styles from "./loading.module.css";

/* 첫 줄과 둘째 줄까지만 그린다. 열 수(4, 3, 2)가 바뀌어도 화면 높이를 대충 채운다. */
const SKELETON_TILE_COUNT = 8 as const;

/* 이 파일이 Suspense 경계가 되어 준다. 없으면 unauthorized()가 문서 전체를 클라이언트에서
   다시 그리게 만들어, head의 테마 스크립트가 넣어 둔 data-theme이 지워지고 화면이 한 번
   밝아진다. 대신 응답이 먼저 시작되므로 401 화면의 상태 코드는 200이 된다. */
export default function Loading() {
	return (
		<main className={`${pageStyles.main} ${styles.main}`} aria-busy="true">
			<div className={styles.heading} role="status" aria-label="내 프로필 목록을 불러오는 중입니다.">
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
