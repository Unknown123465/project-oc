import pageStyles from "./page.module.css";
import styles from "./loading.module.css";
import {SETTING_SECTIONS} from "@/app/setting/validator";

/* 화면 높이를 채울 만큼만 문단 뼈대를 그린다. */
const SKELETON_SECTION_COUNT = 3 as const;
const SKELETON_ROW_COUNT = 3 as const;

/* 이 파일이 Suspense 경계가 되어 준다. 없으면 unauthorized()가 문서 전체를 클라이언트에서
   다시 그리게 만들어, head의 테마 스크립트가 넣어 둔 data-theme이 지워지고 화면이 한 번
   밝아진다. 대신 응답이 먼저 시작되므로 401 화면의 상태 코드는 200이 된다. */
export default function Loading() {
	return (
		<main className={`${pageStyles.main} ${styles.main}`} aria-busy="true">
			<div className={styles.title} role="status" aria-label="계정 설정을 불러오는 중입니다." />

			<div className={pageStyles.layout} aria-hidden="true">
				<div className={styles.nav}>
					{SETTING_SECTIONS.map(({id}) => (
						<div key={id} />
					))}
				</div>

				<div className={pageStyles.sections}>
					{Array.from({length: SKELETON_SECTION_COUNT}, (_, sectionIndex) => (
						<div key={sectionIndex} className={styles.section}>
							<div className={styles.heading} />

							{Array.from({length: SKELETON_ROW_COUNT}, (_, rowIndex) => (
								<div key={rowIndex} className={styles.row} />
							))}
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
