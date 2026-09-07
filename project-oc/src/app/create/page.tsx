import styles from "./page.module.css";
import CreateWorkspace from "../_components/create/CreateWorkspace";
import {auth} from "@/auth/auth";
import {redirect} from "next/navigation";

export default async function Create() {
	const authInfo = await auth();

	if (authInfo === null) {
		return redirect("/", "replace");
	}

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
