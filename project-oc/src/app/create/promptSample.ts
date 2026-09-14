import type {CreatePromptResultFormType} from "./validator";

/* AI 응답 표본.
   크레딧이나 API 키 없이도 결과 화면 배선(항목 반영·이미지 크롭 연동)을 검증하려고 둔다.
   promptAction이 AI_DRAFT_USE_SAMPLE 스위치가 켜졌을 때만 이 값을 돌려준다.

   TODO: 실제 응답으로 전 구간 검증이 끝나면 이 파일과 promptAction의 스위치를 함께 지운다.
   남겨 두면 "왜 AI가 항상 세라핀을 만들지" 하는 사고로 이어진다. */
export const PROMPT_SAMPLE_RESULT: CreatePromptResultFormType = {
	layout: {
		type: "s",
		/* 40자 상한을 실제로 채운 값. 결과 화면에서 줄바꿈이 깨지지 않는지 같이 본다. */
		reason: "기".repeat(39) + "모",
		fx: 0.4,
		fy: 0.6,
	},
	color: "#7c5cff",
	fields: {
		charName: {value: "세라핀"},
		charMessage: {value: "단 것 앞에서는 무너지는 은발의 검사."},
		charLike: {value: "단 것, 고양이"},
		charHate: {value: "비 오는 날"},
		charPersonality: {value: "말수가 적고 무뚝뚝하지만 정이 많다."},
		charTmi: {value: "고양이 이름은 콩이라고 부른다\n비 오는 날엔 집 밖으로 안 나간다"},
		charKind: {value: "반요"},
		charAge: {value: "열아홉"},
		/* 아래 셋은 빈 항목·근거 부족 항목의 화면 처리를 보려고 일부러 비워 둔 값이다. */
		charBirthday: {value: null},
		charHeight: {value: null},
		charBirthplace: {value: null, reason: "unverified"},
		charMbti: {value: null},
	},
};
