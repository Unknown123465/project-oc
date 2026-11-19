import pageStyles from "./page.module.css";
import styles from "../loading.module.css";

/* 계정 설정의 loading.tsx와 같은 이유로 둔다. 없으면 unauthorized()가 문서 전체를 다시 그려
   다크 모드에서 화면이 한 번 밝아진다. 대신 401 화면의 상태 코드는 200이 된다.
   목차 없이 판 하나만 그린다. 완료 페이지도 이 뼈대를 같이 쓴다. */
export default function Loading() {
	return (
		<main className={`${pageStyles.main} ${styles.main}`} aria-busy="true">
			<div className={styles.title} role="status" aria-label="불러오는 중입니다." />

			<div className={`${pageStyles.panel} ${styles.section}`} aria-hidden="true">
				<div className={styles.heading} />
				<div className={styles.row} />
				<div className={styles.row} />
				<div className={styles.row} />
			</div>
		</main>
	);
}
