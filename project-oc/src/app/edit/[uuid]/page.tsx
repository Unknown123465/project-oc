import styles from "@/app/create/page.module.css";
import CreateWorkspace from "@/app/_components/create/CreateWorkspace";
import {auth} from "@/auth/auth";
import {notFound, unauthorized} from "next/navigation";
import {getAiDraftRemaining} from "@/app/create/aiDraftUsage";
import {getAiDraftEnabled} from "@/app/create/globalConfig";
import {getCharacterAsRows} from "@/app/template/[uuid]/getCharacter";
import {toEditFormValues} from "./toEditFormValues";
import Link from "next/link";
import {toEncodeParam} from "./toEncodeParam";

/* notFound(), unauthorized()를 던지면 같은 폴더의 not-found.tsx, unauthorized.tsx로 모인다.  */
export default async function EditPage({params, searchParams}: PageProps<"/edit/[uuid]">) {
	const {uuid} = await params;
	const {link, page, keyword, sort, public_mode} = await searchParams;

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

	const backURL: string =
		link === "mylist"
			? `/mylist?${toEncodeParam("page", page, "1")}${toEncodeParam("keyword", keyword)}${toEncodeParam("sort", sort)}${toEncodeParam("public_mode", public_mode)}`.replace(/&+$/, "")
			: `/template/${uuid}`;

	return (
		<main className={styles.main}>
			<section className={styles.heading}>
				<Link href={backURL}>← {link === "mylist" ? "리스트" : "프로필"}로</Link>

				<h1>캐릭터 수정</h1>

				<p className={styles.subtitle}>바꿀 곳만 고치면 돼요. 오른쪽 프로필에 바로 반영돼요.</p>
			</section>

			<CreateWorkspace character={characterResult} aiDraftRemaining={aiDraftRemaining} aiDraftEnabled={aiDraftEnabled} backURL={backURL} />
		</main>
	);
}
