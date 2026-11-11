import styles from "@/app/create/page.module.css";
import CreateWorkspace from "@/app/_components/create/CreateWorkspace";
import {auth} from "@/auth/auth";
import {notFound, unauthorized} from "next/navigation";
import {getAiDraftRemaining} from "@/app/create/aiDraftUsage";
import {getAiDraftEnabled} from "@/app/create/globalConfig";
import {getCharacterAsRows} from "@/app/template/[uuid]/getCharacter";
import {toEditFormValues} from "./toEditFormValues";
import Link from "next/link";
/* notFound(), unauthorized()를 던지면 같은 폴더의 not-found.tsx, unauthorized.tsx로 모인다.  */
export default async function EditPage({params}: PageProps<"/edit/[uuid]">) {
	const uuid = (await params).uuid;

	const authInfo = await auth();

	if (authInfo === null) {
		return unauthorized();
	}

	const character = await getCharacterAsRows(uuid);

	if (!character.success) {
		if (character.reason === "notLoggedIn") {
			unauthorized();
		} else {
			notFound();
		}
	}

	const characterResult = toEditFormValues(character.result);

	/* 화면은 이 값에서 출발하고, 이후로는 서버 액션이 돌려주는 수로 맞춘다. */
	const aiDraftRemaining: number = await getAiDraftRemaining(authInfo.user?.id);
	const aiDraftEnabled: boolean = await getAiDraftEnabled();

	return (
		<main className={styles.main}>
			<section className={styles.heading}>
				<Link href={`/template/${uuid}`}>← 프로필로</Link>

				<h1>캐릭터 수정</h1>

				<p className={styles.subtitle}>바꿀 곳만 고치면 돼요. 오른쪽 프로필에 바로 반영돼요.</p>
			</section>

			<CreateWorkspace character={characterResult} aiDraftRemaining={aiDraftRemaining} aiDraftEnabled={aiDraftEnabled} />
		</main>
	);
}
