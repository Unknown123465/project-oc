import {cache} from "react";
import {unstable_cache} from "next/cache";
import {auth} from "@/auth/auth";
import db from "@/prisma/client";
import {isUuid, uuidToBin} from "@/prisma/uuid";
import {PUBLIC_MODE_PRIVATE, PUBLIC_MODE_PUBLIC} from "@/app/create/r2";
import {toMusicEmbed} from "@/app/create/musicEmbed";
import {charImageURL} from "./r2";
import type {ImageFrame, ProfileLayout, TemplateCharacter} from "@/app/_components/template/CharacterProfile";

/* 캐시가 들고 있는 건 DB 행이지 이미지 서명이 아니다. 그래서 이 값은 "공개 설정을
   바꾸거나 캐릭터를 지웠을 때 화면에 반영되기까지 걸리는 최대 시간"으로 읽어야 한다.
   공개→비공개 전환이 늦게 먹히는 건 화면이 낡은 정도가 아니라 프라이버시 문제라,
   수정·삭제 기능을 붙일 때 아래 characterTag로 revalidateTag를 반드시 같이 호출한다. */
const CHARACTER_CACHE_MAX_AGE: number = 600;

const PROFILE_LAYOUTS: readonly ProfileLayout[] = ["h", "v", "s"];
const IMAGE_FRAME: readonly ImageFrame[] = ["square", "circle"];

/* DB의 charProfileLayout은 CHAR(1)이라 어떤 글자든 들어갈 수 있다. 값이 셋 중
   하나가 아니면 커버가 통째로 안 그려지므로 가로형으로 떨어뜨린다. */
const DEFAULT_PROFILE_LAYOUT: ProfileLayout = "h";
const DEFAULT_IMAGE_FRAME: ImageFrame = "square";

export interface CharacterView extends TemplateCharacter {
	/** 이미지 주소가 만료되지 않는 공개 주소인지. 동적 metadata에서 og:image를 넣을지
	 *  판단하는 데 쓴다. 서명 주소를 og:image에 넣으면 크롤러가 나중에 다시 가져갈 때는
	 *  이미 만료돼 있고, 비공개 이미지가 SNS 쪽 캐시에 남는다. */
	imagePublic: boolean;
}

/** 수정·삭제 시 이 태그로 무효화한다. 문자열을 직접 쓰지 않게 여기서만 만든다. */
export function characterTag(uuid: string): string {
	return `character:${uuid}`;
}

/* Json 컬럼이라 타입이 보장되지 않는다. as string[]로 단언하면 TMI를 비워 둔
   캐릭터(null)가 그대로 통과해 화면에서 .length를 부를 때 터진다. */
function toTmiLines(raw: unknown): string[] {
	return Array.isArray(raw) ? raw.filter((line): line is string => typeof line === "string") : [];
}

function toProfileLayout(raw: string): ProfileLayout {
	return PROFILE_LAYOUTS.find((layout) => layout === raw) ?? DEFAULT_PROFILE_LAYOUT;
}

function toImageFrame(raw: string): ImageFrame {
	return IMAGE_FRAME.find((frame) => frame === raw) ?? DEFAULT_IMAGE_FRAME;
}

/* 저장할 때 통과한 주소라도 그 사이 임베드 지원이 바뀔 수 있어 읽을 때 다시 본다.
   임베드로 바꿀 수 없는 주소면 테마곡 자체를 접는다. */
function toMusicView(raw: string | null): TemplateCharacter["charMusic"] {
	if (raw === null) {
		return null;
	}

	const embed = toMusicEmbed(raw);

	return embed === null ? null : {href: raw, embedSrc: embed.src, height: embed.height};
}

/* 태그에 uuid가 들어가야 캐릭터 한 명만 골라 무효화할 수 있어, 캐시를 uuid마다
   만든다(Next 문서의 unstable_cache 예제도 같은 모양이다). 인자를 받지 않는 대신
   uuid를 클로저로 잡으므로 keyParts에 uuid를 반드시 넣어야 한다. 빠뜨리면 모든
   캐릭터가 같은 키를 공유해 남의 프로필이 나간다.

   쿠키·헤더는 이 안에서 읽을 수 없다(Next 문서 명시). 그래서 여기서는 공개 여부를
   판단하지 않고, 판단에 필요한 charPublicMode와 charUploaderId를 같이 꺼내 온다. */
function cachedCharacterRow(uuid: string) {
	return unstable_cache(
		async () => {
			return await db.character.findUnique({
				where: {
					charPublicLink: uuidToBin(uuid),
				},
				/* 화면에 쓰는 열만 고른다. charUploaderId가 행에 이미 있어 user를
				   조인할 이유가 없다. */
				select: {
					charName: true,
					charMessage: true,
					charProfileLayout: true,
					charImageFrame: true,
					charImage: true,
					charColor: true,
					charKind: true,
					charAge: true,
					charBirthday: true,
					charHeight: true,
					charMbti: true,
					charBirthplace: true,
					charLike: true,
					charHate: true,
					charPersonality: true,
					charTmi: true,
					charMusic: true,
					aiUsed: true,
					charPublicMode: true,
					charUploaderId: true,
				},
			});
		},
		["template-character", uuid],
		{revalidate: CHARACTER_CACHE_MAX_AGE, tags: [characterTag(uuid)]},
	);
}

/* 한 요청 안에서 generateMetadata와 페이지가 각각 부르므로 react의 cache로 묶는다.
   여기서 캐릭터를 못 찾은 것과 볼 권한이 없는 것을 모두 null로 돌려준다. 부르는 쪽이
   둘을 구분하면 "없음"과 "비공개"가 응답으로 갈려 링크만으로 존재 여부가 새어 나간다. */
export const getCharacter = cache(async (uuid: string): Promise<CharacterView | null> => {
	/* uuidToBin은 형식이 틀리면 예외를 던진다. 주소창에서 온 값이라 손으로 고친 링크는
	   장애가 아니라 없는 페이지다. */
	if (!isUuid(uuid)) {
		return null;
	}

	const character = await cachedCharacterRow(uuid)();

	if (character === null) {
		return null;
	}

	/* 비공개(2)는 올린 사람만 본다. 이 확인이 캐시 밖에 있어야 하는 이유는, 캐시가
	   uuid로만 갈려 보는 사람이 누구인지와 무관하기 때문이다. 안에서 판단하면 주인이
	   채워 놓은 항목이 남에게 그대로 나간다. */
	if (character.charPublicMode === PUBLIC_MODE_PRIVATE) {
		const authInfo = await auth();

		if (authInfo?.user?.id !== character.charUploaderId) {
			return null;
		}
	}

	const imagePublic: boolean = character.charPublicMode === PUBLIC_MODE_PUBLIC;

	return {
		charName: character.charName,
		charMessage: character.charMessage,
		charProfileLayout: toProfileLayout(character.charProfileLayout),
		charImageFrame: toImageFrame(character.charImageFrame),
		charImage: await charImageURL(character.charPublicMode, character.charUploaderId, character.charImage),
		charColor: character.charColor,
		charKind: character.charKind,
		charAge: character.charAge,
		charBirthday: character.charBirthday,
		charHeight: character.charHeight,
		charMbti: character.charMbti,
		charBirthplace: character.charBirthplace,
		charLike: character.charLike,
		charHate: character.charHate,
		charPersonality: character.charPersonality,
		charTmi: toTmiLines(character.charTmi),
		charMusic: toMusicView(character.charMusic),
		aiUsed: character.aiUsed === 1,
		/* 좋아요는 아직 저장하는 곳이 없다. 붙일 때 이 값을 위 캐시 안에서 세면
		   숫자가 최대 10분 낡으므로, 캐시 밖에서 따로 세야 한다. */
		likeCount: 0,
		imagePublic,
	};
});
