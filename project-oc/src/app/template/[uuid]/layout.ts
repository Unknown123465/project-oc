import type {Metadata} from "next";
import {getCharacter} from "./getCharacter";

/* 일부공개·비공개 캐릭터의 charImage는 10분짜리 서명 URL이다(r2.ts). 디스코드·카카오톡
   같은 크롤러는 링크를 처음 볼 때 og:image를 한 번 가져가 자기 쪽에 캐싱해 두는데, 그
   시점을 지나 다시 가져가면 이미 만료돼 있다. 공개(0)가 아니면 만료되지 않는 파비콘으로
   갈아 끼워, 카드가 깨진 이미지로 굳어버리는 상황 자체를 피한다. */
const FALLBACK_OG_IMAGE: string = "/favicon.svg";

export async function generateMetadata({params}: LayoutProps<"/template/[uuid]">): Promise<Metadata> {
	const {uuid} = await params;

	const character = await getCharacter(uuid);

	if (character === null) {
		return {title: "찾을 수 없는 프로필"};
	}

	const {charName, charMessage, creator} = character;

	const title: string = `${charName} 프로필 - 프로젝트 OC`;
	const imageUrl: string = character.imagePublic ? character.charImage : FALLBACK_OG_IMAGE;

	return {
		title,
		description: charMessage,
		creator,
		openGraph: {
			title,
			description: charMessage,
			type: "website",
			images: [{url: imageUrl}],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description: charMessage,
			images: [imageUrl],
		},
	};
}

export default function TemplateLayout({children}: LayoutProps<"/template/[uuid]">) {
	return children;
}
