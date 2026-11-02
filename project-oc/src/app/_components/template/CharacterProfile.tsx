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
import {LinkButton} from "@/components/ui/button";
import {CommentFromTemplate} from "@/app/template/[uuid]/commentMessage";

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

/* 코멘트 UI 확인용 임시 데이터. 서버 액션을 연결하면 지운다. */
const PREVIEW_COMMENTS: CommentFromTemplate[] = [
	{commentId: "1", userName: "푸른연필", charComment: "한 문장 소개와 표정이 정말 잘 어울려요.", createdAt: new Date("2026-10-30T09:12:00Z"), updated: false, hidden: false, isMine: false},
	{commentId: "2", userName: "소금별", charComment: "머리핀을 만지는 습관이 귀엽네요!", createdAt: new Date("2026-10-31T02:40:00Z"), updated: true, hidden: false, isMine: true},
	{commentId: "3", userName: "밤산책", charComment: "숨긴 코멘트 본문", createdAt: new Date("2026-11-01T11:05:00Z"), updated: false, hidden: true, isMine: false},
	{commentId: "4", userName: "소금별", charComment: "TMI 세 번째 줄이 제일 좋아요.", createdAt: new Date("2026-11-01T12:30:00Z"), updated: false, hidden: false, isMine: true},
];

interface CharacterProfileProps {
	nonce: string | undefined;
	uuid: string;
	character: CharacterView;
	comments: CommentFromTemplate[] | null;
	/** 비공개 프로필은 좋아요를 받지 않아 null이다. */
	like: ProfileLikeView | null;
	/** 비공개 프로필은 공유할 수 없다. */
	shareable: boolean;
	serverNow: number;
}

export default function CharacterProfile({nonce, uuid, character, comments, like, shareable, serverNow}: CharacterProfileProps) {
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

					<div className={styles.reaction}>
						{like !== null ? <ProfileLike uuid={uuid} like={like} /> : null}

						<LinkButton href={`/template/${uuid}/card`} className={styles.card_link_button} styleType="simple">
							프로필 카드 보기
						</LinkButton>
					</div>
				</article>

				{/* 서버 액션을 연결하기 전 화면 확인용 임시 값. 연결할 때 실제 목록·로그인 여부로 바꾼다. */}
				<Comments uuid={uuid} comments={comments} isOwner={like?.isOwner ?? false} isPrivate={!shareable} serverNow={serverNow} />
			</main>
		</>
	);
}
