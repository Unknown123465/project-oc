import styles from "@/app/_components/auth/EmailConfirmScreen.module.css";

/* 계정 설정의 loading.tsx와 같은 이유로 둔다. 없으면 unauthorized()가 문서 전체를 다시 그려
   다크 모드에서 화면이 한 번 밝아진다. 대신 401 화면의 상태 코드는 200이 된다.
   토큰을 한 번 조회하는 동안만 보이는 자리라 빈 화면으로 둔다. */
export default function Loading() {
	return (
		<main className={styles.main} data-no-footer aria-busy="true">
			<div role="status" aria-label="링크를 확인하는 중입니다." />
		</main>
	);
}
