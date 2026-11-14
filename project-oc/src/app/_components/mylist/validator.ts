import z from "zod";
import type {KakaoShareDetail} from "@/app/_components/template/ShareDialog";

export const MAX_KEYWORD_LENGTH = 30 as const;

/* /mylist에서는 틀린 값을 기본값으로 고쳐 redirect하므로 이 문구가 화면에 나오지 않는다.
   로그인 쿼리(login/validator.ts)가 이 스키마를 그대로 가져다 쓰는데, 거기서는 첫 오류의
   message를 사용자에게 보여 주므로 zod 기본 영어 문구 대신 이 문구를 쓴다. */
export const INVALID_MY_LIST_QUERY = "목록 주소가 올바르지 않아요. 다시 시도해 주세요." as const;

export const myListQueryForm = z.object({
	page: z
		.string(INVALID_MY_LIST_QUERY)
		.regex(/^[1-9]\d*$/, INVALID_MY_LIST_QUERY)
		.refine((value) => !Number.isNaN(parseInt(value, 10)) && parseInt(value) >= 1, INVALID_MY_LIST_QUERY)
		.transform((value) => parseInt(value, 10)),
	keyword: z.string(INVALID_MY_LIST_QUERY).max(MAX_KEYWORD_LENGTH, INVALID_MY_LIST_QUERY).nullish(),
	sort: z
		.enum(["latest", "oldest", "name", "like"], INVALID_MY_LIST_QUERY)
		.nullish()
		.transform((value) => (typeof value !== "string" ? "latest" : value)),
	public_mode: z
		.enum(["all", "public", "link", "private"], INVALID_MY_LIST_QUERY)
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
