import styles from "./page.module.css";
import CreateWorkspace from "../_components/create/CreateWorkspace";
import {auth} from "@/auth/auth";
import {redirect} from "next/navigation";
import {getAiDraftRemaining} from "./aiDraftUsage";
import {getAiDraftEnabled} from "./globalConfig";

export default async function Create() {
	const authInfo = await auth();

	if (authInfo === null) {
		return redirect("/", "replace");
	}

	/* 화면은 이 값에서 출발하고, 이후로는 서버 액션이 돌려주는 수로 맞춘다. */
	const aiDraftRemaining: number = await getAiDraftRemaining(authInfo.user?.id);
	const aiDraftEnabled: boolean = await getAiDraftEnabled();

	return (
		<main className={styles.main}>
			<section className={styles.heading}>
				<h1>새 캐릭터 등록</h1>

				<p className={styles.subtitle}>핵심 정보부터 작성하세요. 오른쪽 프로필은 입력하는 즉시 완성됩니다.</p>
			</section>

			<CreateWorkspace aiDraftRemaining={aiDraftRemaining} aiDraftEnabled={aiDraftEnabled} />
		</main>
	);
}
