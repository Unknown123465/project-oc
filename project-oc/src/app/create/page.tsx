import styles from "./page.module.css";
import CreateWorkspace from "../_components/create/CreateWorkspace";

export default function Create() {
	return (
		<main className={styles.main}>
			<section className={styles.heading}>
				<h1>새 캐릭터 등록</h1>

				<p className={styles.subtitle}>핵심 정보부터 작성하세요. 오른쪽 프로필은 입력하는 즉시 완성됩니다.</p>
			</section>

			<div className={styles.mobile_tabs} role="tablist" aria-label="작성 화면 전환">
				<button type="button" role="tab" aria-selected="true">
					작성
				</button>

				<button type="button" role="tab" aria-selected="false">
					미리보기
				</button>
			</div>

			<CreateWorkspace />
		</main>
	);
}
