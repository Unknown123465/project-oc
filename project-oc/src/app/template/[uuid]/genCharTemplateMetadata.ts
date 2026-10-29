import type {Metadata} from "next";
import type {CharacterView} from "./getCharacter";

interface GenCharTemplateMetadataResult {
	openGraph: Metadata["openGraph"];
	twitter: Metadata["twitter"];
}

/* 일부공개·비공개 캐릭터의 charImage는 10분짜리 서명 URL이다(r2.ts). 디스코드·카카오톡
   같은 크롤러는 링크를 처음 볼 때 og:image를 한 번 가져가 자기 쪽에 캐싱해 두는데, 그
   시점을 지나 다시 가져가면 이미 만료돼 있다. 공개(0)가 아니면 만료되지 않는 share-fallback.png로
   갈아 끼워, 카드가 깨진 이미지로 굳어버리는 상황 자체를 피한다. */
const FALLBACK_OG_IMAGE = "/share-fallback.png" as const;

export function genCharTemplateMetadata(title: string, character: CharacterView): GenCharTemplateMetadataResult {
	const {charMessage, charImage, imagePublic} = character;

	const imageURL: string = imagePublic ? charImage : FALLBACK_OG_IMAGE;

	return {
		openGraph: {
			title,
			description: charMessage,
			type: "website",
			images: [{url: imageURL}],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description: charMessage,
			images: [imageURL],
		},
	};
}
