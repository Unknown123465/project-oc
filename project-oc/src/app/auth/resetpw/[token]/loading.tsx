import pageStyles from "@/app/setting/changepw/page.module.css";
import styles from "@/app/setting/loading.module.css";

/* 비밀번호 변경의 loading.tsx와 같은 이유로 둔다. 없으면 unauthorized(), forbidden()이 문서 전체를
   다시 그려 다크 모드에서 화면이 한 번 밝아진다. 대신 401, 403 화면의 상태 코드는 200이 된다. */
export default function Loading() {
	return (
		<main className={`${pageStyles.main} ${styles.main}`} aria-busy="true">
			<div className={styles.title} role="status" aria-label="링크를 확인하는 중입니다." />

			<div className={`${pageStyles.panel} ${styles.section}`} aria-hidden="true">
				<div className={styles.heading} />
				<div className={styles.row} />
				<div className={styles.row} />
				<div className={styles.row} />
			</div>
		</main>
	);
}
