import {forbidden, notFound, unauthorized} from "next/navigation";
import styles from "./page.module.css";
import {getCharacter} from "../getCharacter";
import {getCharacterLike} from "../characterLike";
import ProfileCardView from "@/app/_components/card/ProfileCardView";
import {PUBLIC_MODE_PRIVATE} from "@/app/create/r2";
import type {Metadata} from "next";
import {genCharTemplateMetadata} from "../genCharTemplateMetadata";

export async function generateMetadata({params}: PageProps<"/template/[uuid]/card">): Promise<Metadata> {
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

	const {charName} = character.result;
	const title: string = `${charName} 프로필 카드 - 프로젝트 OC`;

	return {
		title,
		...genCharTemplateMetadata(title, character.result),
		robots: "noindex, noai, noimageai",
	};
}

export default async function ProfileCardPage({params}: PageProps<"/template/[uuid]/card">) {
	const {uuid} = await params;

	const [character, like] = await Promise.all([getCharacter(uuid), getCharacterLike(uuid)]);

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

	return (
		<main className={styles.main} data-no-header data-no-footer>
			<ProfileCardView key={character.result.charImage.split("?")[0]} uuid={uuid} shareable={character.result.charPublicMode !== PUBLIC_MODE_PRIVATE} like={like} character={character.result} />
		</main>
	);
}
