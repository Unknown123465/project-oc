import type {KoreanSocialProvider} from "@/app/setting/getAccountInfo";
import z from "zod";

/** 목차와 각 문단이 같은 id를 보도록 한곳에 둔다. 순서가 곧 화면 순서다. */
export const SETTING_SECTIONS = [
	{id: "general", label: "일반"},
	{id: "playback", label: "재생 설정"},
	{id: "activity", label: "내 활동"},
	{id: "danger", label: "위험 구역"},
] as const;

export type SettingSectionId = (typeof SETTING_SECTIONS)[number]["id"];

export interface SettingAccount {
	/** 카카오(동의 거부), X는 이메일 없이 가입될 수 있다. */
	email: string | null;
	username: string;
	/** 소셜 가입이면 서비스 이름(예: "네이버"), 일반 가입이면 null. */
	socialProvider: KoreanSocialProvider;
	autoplayMusic: boolean;
}

export interface SettingRankItem {
	uuid: string;
	name: string;
	count: number;
}

export interface SettingActivity {
	profileCount: number;
	likeCount: number;
	commentCount: number;
	/** 많은 순으로 최대 5개. */
	likeTop: SettingRankItem[];
	/** 많은 순으로 최대 5개. 삭제된 코멘트는 빼고 숨김 처리된 코멘트는 센다. */
	commentTop: SettingRankItem[];
}

export const setAutoplayMusicForm = z.boolean("입력값이 올바르지 않아요.");
