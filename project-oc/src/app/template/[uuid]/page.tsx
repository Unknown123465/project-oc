import CharacterProfile from "@/app/_components/template/CharacterProfile";
import {getCharacter} from "./getCharacter";
import {forbidden, notFound, unauthorized} from "next/navigation";
import {getCharacterLike} from "./characterLike";
import {PUBLIC_MODE_PRIVATE} from "@/app/create/r2";
import {headers} from "next/headers";
import {getCommentsByTemplate} from "./comment";

export default async function TemplatePage({params}: PageProps<"/template/[uuid]">) {
	const {uuid} = await params;

	const nonce: string | null = (await headers()).get("x-nonce");

	const [character, like, comments] = await Promise.all([getCharacter(uuid), getCharacterLike(uuid), getCommentsByTemplate(uuid)]);

	if (!character.success) {
		const {reason} = character;

		if (reason === "unauthorized") {
			unauthorized();
		} else if (reason === "forbidden") {
			forbidden();
		} else {
			notFound();
		}
	}

	// 서버 컴포넌트는 요청마다 한 번만 렌더된다. 이 값이 하이드레이션까지 쓰는 기준 시각이다.
	// eslint-disable-next-line react-hooks/purity
	const now: number = Date.now();

	return (
		<>
			<CharacterProfile
				nonce={nonce ?? undefined}
				uuid={uuid}
				character={character.result}
				like={like}
				comments={comments}
				shareable={character.result.charPublicMode !== PUBLIC_MODE_PRIVATE}
				serverNow={now}
			/>
		</>
	);
}
