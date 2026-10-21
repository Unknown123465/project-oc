import CharacterProfile from "@/app/_components/template/CharacterProfile";
import {getCharacter} from "./getCharacter";
import {notFound} from "next/navigation";
import {getCharacterLike} from "./characterLike";
import {PUBLIC_MODE_PRIVATE} from "@/app/create/r2";
import {headers} from "next/headers";

export default async function TemplatePage({params}: PageProps<"/template/[uuid]">) {
	const {uuid} = await params;

	const nonce: string | null = (await headers()).get("x-nonce");

	const [character, like] = await Promise.all([getCharacter(uuid), getCharacterLike(uuid)]);

	if (character === null) {
		notFound();
	}

	return (
		<>
			<CharacterProfile nonce={nonce ?? undefined} uuid={uuid} character={character} like={like} shareable={character.charPublicMode !== PUBLIC_MODE_PRIVATE} />
		</>
	);
}
