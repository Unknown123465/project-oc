import type {Metadata} from "next";
import {getCharacter} from "./getCharacter";
import {genCharTemplateMetadata} from "./genCharTemplateMetadata";

export async function generateMetadata({params}: LayoutProps<"/template/[uuid]">): Promise<Metadata> {
	const {uuid} = await params;

	const character = await getCharacter(uuid);

	if (!character.success) {
		const {reason} = character;

		if (reason === "unauthorized") {
			return {title: "로그인이 필요한 프로필 - 프로젝트 OC"};
		} else if (reason === "forbidden") {
			return {title: "볼 수 없는 프로필 - 프로젝트 OC"};
		} else {
			return {title: "찾을 수 없는 프로필 - 프로젝트 OC"};
		}
	}

	const {charName, charMessage, creator, imagePublic} = character.result;
	const title: string = `${charName} 프로필 - 프로젝트 OC`;

	return {
		title,
		description: charMessage,
		creator,
		...genCharTemplateMetadata(title, character.result),
		robots: imagePublic ? "index, noai, noimageai" : "noindex, noai, noimageai",
	};
}

export default function TemplateLayout({children}: LayoutProps<"/template/[uuid]">) {
	return children;
}
