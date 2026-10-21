import styles from "./CharacterProfile.module.css";
import ProfileActions from "./ProfileActions";
import ProfileCover from "./ProfileCover";
import ProfileIdentity from "./ProfileIdentity";
import ProfileFacts, {toProfileFacts} from "./ProfileFacts";
import ProfileBlocks from "./ProfileBlocks";
import Comments from "./Comments";
import ProfileLike, {type ProfileLikeView} from "./ProfileLike";
import type {IframeHeight} from "@/app/create/musicEmbed";
import {CharacterView} from "@/app/template/[uuid]/getCharacter";
import {PUBLIC_MODE_PUBLIC} from "@/app/create/r2";

export type ProfileLayout = "h" | "v" | "s";
export type ImageFrame = "square" | "circle";

export interface TemplateCharacter {
	charName: string;
	charMessage: string;
	charProfileLayout: ProfileLayout;
	charImageFrame: ImageFrame;
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
}

interface CharacterProfileProps {
	nonce: string | undefined;
	uuid: string;
	character: CharacterView;
	/** 비공개 프로필은 좋아요를 받지 않아 null이다. */
	like: ProfileLikeView | null;
	/** 비공개 프로필은 공유할 수 없다. */
	shareable: boolean;
}

export default function CharacterProfile({nonce, uuid, character, like, shareable}: CharacterProfileProps) {
	const layout: ProfileLayout = character.charProfileLayout;

	const alt: string = `${character.charName} 캐릭터 일러스트`;

	let cover;
	let sheet;

	const aiUsedFlag = character.aiUsed ? (
		<p className={styles.ai_disclosure} role="note">
			<strong>AI 이미지 안내</strong>

			<span>AI를 사용한 이미지입니다.</span>
		</p>
	) : null;

	const content = (
		<>
			<ProfileIdentity character={character} centered={layout === "s"} />

			<ProfileFacts character={character} />

			<ProfileBlocks character={character} />
		</>
	);

	if (layout === "h") {
		cover = <ProfileCover layout={layout} imageSrc={character.charImage} alt={alt} color={character.charColor} />;

		sheet = (
			<>
				{cover}

				<div className={styles.inner}>
					{aiUsedFlag}

					{content}
				</div>
			</>
		);
	} else if (layout === "v") {
		cover = <ProfileCover layout={layout} imageSrc={character.charImage} alt={alt} color={character.charColor} />;

		sheet = (
			<div className={styles.inner}>
				<div className={styles.hero_grid}>
					{cover}

					<div>
						{aiUsedFlag}

						{content}
					</div>
				</div>
			</div>
		);
	} else {
		cover = <ProfileCover layout={layout} imageSrc={character.charImage} alt={alt} color={character.charColor} />;

		sheet = (
			<div className={styles.inner}>
				{cover}

				<div className={styles.ai_disclosure_wrap}>{aiUsedFlag}</div>

				{content}
			</div>
		);
	}

	return (
		<>
			<main className={styles.main}>
				<ProfileActions
					nonce={nonce}
					uuid={uuid}
					charName={character.charName}
					charMessage={character.charMessage}
					kakaoDetail={{
						creator: character.creator,
						facts: toProfileFacts(character).map(({label, value}) => ({label, value})),
						likeCount: like === null ? null : like.count,
					}}
					shareable={shareable}
					imageSrc={character.charImage}
					isPublic={character.charPublicMode === PUBLIC_MODE_PUBLIC}
				/>

				<article className={styles.sheet}>
					{sheet}

					{like !== null ? (
						<div className={styles.reaction}>
							<ProfileLike uuid={uuid} like={like} />
						</div>
					) : null}
				</article>

				<Comments />
			</main>
		</>
	);
}
