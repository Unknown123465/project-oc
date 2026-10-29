import type {Metadata} from "next";
import {getCharacter} from "./getCharacter";
import {genCharTemplateMetadata} from "./genCharTemplateMetadata";

export async function generateMetadata({params}: LayoutProps<"/template/[uuid]">): Promise<Metadata> {
	const {uuid} = await params;

	const character = await getCharacter(uuid);

	if (character === null) {
		return {title: "찾을 수 없는 프로필"};
	}

	const {charName, charMessage, creator} = character;
	const title: string = `${charName} 프로필 - 프로젝트 OC`;

	return {
		title,
		description: charMessage,
		creator,
		...genCharTemplateMetadata(title, character),
	};
}

export default function TemplateLayout({children}: LayoutProps<"/template/[uuid]">) {
	return children;
}
