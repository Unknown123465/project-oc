import CharacterProfile from "@/app/_components/template/CharacterProfile";
import {getCharacter} from "./getCharacter";
import {notFound} from "next/navigation";

export default async function TemplatePage({params}: PageProps<"/template/[uuid]">) {
	const {uuid} = await params;

	const character = await getCharacter(uuid);

	if (character === null) {
		notFound();
	}

	return <CharacterProfile uuid={uuid} character={character} />;
}
