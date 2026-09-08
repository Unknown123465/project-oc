import styles from "./CharacterProfile.module.css";
import ProfileActions from "./ProfileActions";
import ProfileCoverHorizontal from "./ProfileCoverHorizontal";
import ProfileCoverVertical from "./ProfileCoverVertical";
import ProfileCoverSquare from "./ProfileCoverSquare";
import ProfileIdentity from "./ProfileIdentity";
import ProfileFacts from "./ProfileFacts";
import ProfileBlocks from "./ProfileBlocks";
import Comments from "./Comments";
import ShareDialog from "./ShareDialog";
import type {IframeHeight} from "@/app/create/musicEmbed";

export type ProfileLayout = "h" | "v" | "s";

export interface TemplateCharacter {
	charName: string;
	charMessage: string;
	charProfileLayout: ProfileLayout;
	charImage: string;
	charColor: string;
	charKind: string | null;
	charAge: string | null;
	charBirthday: string | null;
	charHeight: string | null;
	charMbti: string | null;
	charBirthplace: string | null;
	charLike: string | null;
	charHate: string | null;
	charPersonality: string | null;
	charTmi: string[];
	charMusic: {href: string; embedSrc: string; height: IframeHeight} | null;
	aiUsed: boolean;
	likeCount: number;
}

interface CharacterProfileProps {
	uuid: string;
	character: TemplateCharacter;
}

export default function CharacterProfile({uuid, character}: CharacterProfileProps) {
	const layout = character.charProfileLayout;

	const alt = `${character.charName} 캐릭터 전신 일러스트`;

	const cover =
		layout === "h" ? (
			<ProfileCoverHorizontal imageSrc={character.charImage} alt={alt} color={character.charColor} />
		) : layout === "v" ? (
			<ProfileCoverVertical imageSrc={character.charImage} alt={alt} color={character.charColor} />
		) : (
			<ProfileCoverSquare imageSrc={character.charImage} alt={alt} color={character.charColor} />
		);

	const content = (
		<>
			<ProfileIdentity character={character} centered={layout === "s"} />

			<ProfileFacts character={character} />

			<ProfileBlocks character={character} />
		</>
	);

	return (
		<>
			<main className={styles.main}>
				<ProfileActions likeCount={character.likeCount} />

				<article className={styles.sheet}>
					{layout === "h" ? (
						<>
							{cover}

							<div className={styles.inner}>{content}</div>
						</>
					) : null}

					{layout === "v" ? (
						<div className={styles.inner}>
							<div className={styles.hero_grid}>
								{cover}

								<div>
									{character.aiUsed ? (
										<p className={styles.ai_disclosure} role="note">
											<strong>AI 이미지 안내</strong>

											<span>AI를 사용한 이미지입니다.</span>
										</p>
									) : null}

									{content}
								</div>
							</div>
						</div>
					) : null}

					{layout === "s" ? (
						<div className={styles.inner}>
							{cover}

							{content}
						</div>
					) : null}
				</article>

				<Comments />
			</main>

			<ShareDialog uuid={uuid} characterName={character.charName} />
		</>
	);
}
