import type {KoreanSocialProvider} from "@/app/setting/getAccountInfo";
import z from "zod";
import {emailField, passwordField, userNameField} from "@/app/signup/validator";

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

export const changeUserNameForm = z.object({
	userName: userNameField,
});

export type ChangeUserNameFormType = z.infer<typeof changeUserNameForm>;

/* 지금 이름을 그대로 제출했을 때의 안내. 화면(요청 전에 막음)과 서버 액션이 같은 문구를 쓴다. */
export const SAME_USER_NAME_MESSAGE = "지금 쓰고 있는 이름과 같아요. 다른 이름으로 수정해 주세요." as const;

export const changeEmailForm = z.object({
	email: emailField,
});

export type ChangeEmailFormType = z.infer<typeof changeEmailForm>;

export const changePasswordForm = z
	.object({
		/* 지금 비밀번호는 가입 규칙이 바뀌기 전에 만든 것일 수 있어 비어 있는지만 본다. */
		currentPassword: z.string("값이 올바르지 않음").min(1, "현재 비밀번호를 입력해 주세요."),
		newPassword: passwordField,
		newPasswordRepeat: z.string("값이 올바르지 않음").min(1, "새 비밀번호를 한 번 더 입력해 주세요."),
	})
	.refine((data) => data.newPassword === data.newPasswordRepeat, {
		message: "새 비밀번호가 일치하지 않아요.",
		path: ["newPasswordRepeat"],
	})
	.refine((data) => data.currentPassword !== data.newPassword, {
		message: "새 비밀번호가 현재 비밀번호와 같아요. 다른 비밀번호를 입력해 주세요.",
		path: ["newPassword"],
	});

export type ChangePasswordFormType = z.infer<typeof changePasswordForm>;
