import z from "zod";
import type {KakaoShareDetail} from "@/app/_components/template/ShareDialog";

export const MAX_KEYWORD_LENGTH = 30 as const;

export const myListQueryForm = z.object({
	page: z
		.string()
		.regex(/^[1-9]\d*$/)
		.refine((value) => !Number.isNaN(parseInt(value, 10)) && parseInt(value) >= 1)
		.transform((value) => parseInt(value, 10)),
	keyword: z.string().max(MAX_KEYWORD_LENGTH).nullish(),
	sort: z
		.enum(["latest", "oldest", "name", "like"])
		.nullish()
		.transform((value) => (typeof value !== "string" ? "latest" : value)),
	public_mode: z
		.enum(["all", "public", "link", "private"])
		.nullish()
		.transform((value) => (typeof value !== "string" ? "all" : value)),
});

export type MyListQueryFormType = z.infer<typeof myListQueryForm>;

export type MyListSort = MyListQueryFormType["sort"];

export type MyListPublicMode = MyListQueryFormType["public_mode"];

/** 목록 타일 하나가 그리는 값. */
export interface MyListItem {
	uuid: string;
	charName: string;
	charImage: string;
	charColor: string;
	/** 0 공개, 1 일부 공개, 2 비공개 */
	charPublicMode: number;
	likeCount: number;
	commentCount: number;
	/** 공유 메시지 설명에 쓰는 캐릭터 한마디. */
	charMessage: string;
	kakaoDetail: KakaoShareDetail;
}
