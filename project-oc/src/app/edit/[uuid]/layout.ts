import {getCharacterAsRows} from "@/app/template/[uuid]/getCharacter";
import {Metadata} from "next";

export async function generateMetadata({params}: LayoutProps<"/edit/[uuid]">): Promise<Metadata> {
	const {uuid} = await params;

	const character = await getCharacterAsRows(uuid);

	if (!character.success) {
		return {
			title: `${character.reason === "notLoggedIn" ? "로그인이 필요한 프로필" : "찾을 수 없는 프로필"} - 프로젝트 OC`,
			robots: "noindex",
		};
	}

	const title: string = `${character.result.charName} 프로필 수정 - 프로젝트 OC`;

	return {
		title,
		robots: "noindex",
	};
}

export default function EditCharacterLayout({children}: LayoutProps<"/edit/[uuid]">) {
	return children;
}
