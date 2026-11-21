import z from "zod";
import {INVALID_MY_LIST_QUERY, myListQueryForm} from "../mylist/validator";
import type {KakaoShareDetail} from "@/app/_components/template/ShareDialog";
import type {ProfileLayout} from "@/app/_components/template/CharacterProfile";

/* 둘러보기는 공개 프로필만 보여 줘서 공개 여부 쿼리가 없고, 정렬은 최신순과 좋아요순 둘만 있다.
   페이지와 검색어 검사는 /mylist와 같아야 하므로 같은 스키마에서 두 칸을 가져온다. */
export const browseQueryForm = myListQueryForm.pick({page: true, keyword: true}).extend({
	sort: z
		.enum(["latest", "like"], INVALID_MY_LIST_QUERY)
		.nullish()
		.transform((value) => (typeof value !== "string" ? "latest" : value)),
});

export type BrowseQueryFormType = z.infer<typeof browseQueryForm>;

export type BrowseSort = BrowseQueryFormType["sort"];

/** 둘러보기 타일 하나가 그리는 값. 전부 공개 프로필이라 공개 여부 값이 없다. */
export interface BrowseItem {
	uuid: string;
	charName: string;
	charImage: string;
	charColor: string;
	/** 업로드 때 이 비율로 크롭된다. 세로형(v)이면 타일에서 이미지 위쪽(머리)을 보여 준다. */
	charProfileLayout: ProfileLayout;
	likeCount: number;
	commentCount: number;
	/** 한 줄 소개. 타일의 이름 아래에 보이고, 공유 메시지 설명에도 쓴다. */
	charMessage: string;
	kakaoDetail: KakaoShareDetail;
}
