import styles from "./page.module.css";
import CreateWorkspace from "../_components/create/CreateWorkspace";

export default function Create() {
	return (
		<main className={styles.main}>
			<section className={styles.heading}>
				<h1>새 캐릭터 등록</h1>

				<p className={styles.subtitle}>핵심 정보부터 작성하세요. 오른쪽 프로필은 입력하는 즉시 완성됩니다.</p>
			</section>

			<CreateWorkspace />
		</main>
	);
}
