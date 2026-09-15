import {describe, expect, it} from "vitest";
import {
	AI_DRAFT_DAILY_CALL_LIMIT,
	AI_DRAFT_DAILY_LIMIT,
	CHAR_MAX_LENGTH,
	CHAR_TMI_MAX_LINE_LENGTH,
	CHAR_TMI_MAX_LINES,
	createPromptResultForm,
	getKstToday,
	remainingFrom,
	toRefundReason,
} from "./validator";
import {FinishReason} from "@google/genai";

/* AI 응답 스키마는 사람이 채운 폼이 아니라 모델이 만든 JSON을 받는 자리다. 그래서
   "틀리면 거부"가 아니라 "고칠 수 있으면 고쳐서 받는다"로 동작한다 — 응답 하나가
   하루 10회 중 1회라, 한 글자 넘겼다고 전체를 버리면 사용자가 횟수만 잃는다.

   여기서 확인하는 건 그 "고쳐 받는" 동작이다. 화면에서는 눈에 잘 안 띄고(값이 조금
   달라질 뿐 오류가 나지 않는다) 모델 응답은 매번 달라 수동으로 재현하기 어렵다. */

/** 스키마가 요구하는 최소 형태. 확인할 항목만 덮어써서 쓴다. */
function resultFixture(override: Record<string, unknown> = {}) {
	return {
		layout: {type: "s", reason: "정사각형을 추천합니다", fx: 0.5, fy: 0.5},
		color: "#7c5cff",
		fields: {
			charName: {value: "세라핀"},
			charMessage: {value: "한 줄 소개"},
			charLike: {value: null},
			charHate: {value: null},
			charPersonality: {value: null},
			charTmi: {value: null},
			charKind: {value: null},
			charAge: {value: null},
			charBirthday: {value: null},
			charHeight: {value: null},
			charBirthplace: {value: null},
			charMbti: {value: null},
		},
		...override,
	};
}

function parseResult(override: Record<string, unknown> = {}) {
	const check = createPromptResultForm.safeParse(resultFixture(override));

	if (!check.success) {
		throw new Error(`스키마가 표본을 거부했다: ${check.error.issues[0].message}`);
	}

	return check.data;
}

describe("길이를 넘긴 값은 버리지 않고 자른다", () => {
	it.each([
		["charName", CHAR_MAX_LENGTH.charName],
		["charMessage", CHAR_MAX_LENGTH.charMessage],
		["charLike", CHAR_MAX_LENGTH.charLike],
		["charKind", CHAR_MAX_LENGTH.charKind],
		["charMbti", CHAR_MAX_LENGTH.charMbti],
	])("%s은 %i자로 잘린다", (key, max) => {
		const parsed = parseResult({
			fields: {...resultFixture().fields, [key]: {value: "가".repeat(max + 20)}},
		});

		expect(parsed.fields?.[key as "charName"].value).toHaveLength(max);
	});

	it("layout.reason도 잘린다 - 모델이 40자를 넘기는 일이 잦다", () => {
		const parsed = parseResult({
			layout: {type: "v", reason: "기".repeat(100), fx: 0.5, fy: 0.5},
		});

		expect(parsed.layout?.reason).toHaveLength(40);
	});

	it("앞뒤 공백은 길이를 세기 전에 턴다", () => {
		const parsed = parseResult({
			fields: {...resultFixture().fields, charName: {value: "  세라핀  "}},
		});

		expect(parsed.fields?.charName.value).toBe("세라핀");
	});
});

describe("TMI는 줄 수와 줄당 글자 수로 자른다", () => {
	it(`${CHAR_TMI_MAX_LINES}줄을 넘기면 뒤쪽 줄을 버린다`, () => {
		const parsed = parseResult({
			fields: {...resultFixture().fields, charTmi: {value: Array.from({length: 12}, (_, index) => `줄${index}`).join("\n")}},
		});

		expect(parsed.fields?.charTmi.value?.split("\n")).toHaveLength(CHAR_TMI_MAX_LINES);
	});

	it(`각 줄은 ${CHAR_TMI_MAX_LINE_LENGTH}자로 잘린다`, () => {
		const parsed = parseResult({
			fields: {...resultFixture().fields, charTmi: {value: `${"가".repeat(50)}\n${"나".repeat(50)}`}},
		});

		for (const line of parsed.fields?.charTmi.value?.split("\n") ?? []) {
			expect(line).toHaveLength(CHAR_TMI_MAX_LINE_LENGTH);
		}
	});

	/* 프롬프트로 "마침표를 붙이지 마세요"라고 지시해도 모델이 습관적으로 붙인다.
	   화면에 그대로 나가면 안 되므로 스키마가 한 번 더 뗀다. */
	it("줄 끝 마침표를 뗀다", () => {
		const parsed = parseResult({
			fields: {...resultFixture().fields, charTmi: {value: "고양이를 좋아한다.\n비 오는 날엔 안 나간다."}},
		});

		expect(parsed.fields?.charTmi.value).toBe("고양이를 좋아한다\n비 오는 날엔 안 나간다");
	});

	/* 말줄임표는 의미가 있는 표기라 통째로 지우면 안 된다. 마지막 한 글자만 본다. */
	it("말줄임표는 통째로 지우지 않는다", () => {
		const parsed = parseResult({
			fields: {...resultFixture().fields, charTmi: {value: "말끝을 흐린다..."}},
		});

		expect(parsed.fields?.charTmi.value).toBe("말끝을 흐린다..");
	});
});

describe("색과 초점은 다듬어서 받는다", () => {
	it.each([
		["#FFF", "#ffffff"],
		["  #7C5CFF  ", "#7c5cff"],
		["#7c5cff", "#7c5cff"],
	])("색 %s은 %s로 정규화된다", (input, expected) => {
		expect(parseResult({color: input}).color).toBe(expected);
	});

	it("0~1을 벗어난 fx·fy는 양 끝으로 당긴다", () => {
		const parsed = parseResult({
			layout: {type: "h", reason: "가로를 추천합니다", fx: 1.7, fy: -3},
		});

		expect(parsed.layout?.fx).toBe(1);
		expect(parsed.layout?.fy).toBe(0);
	});

	it("색 형식이 아예 어긋나면 거부한다 - 이건 고칠 수 없다", () => {
		expect(createPromptResultForm.safeParse(resultFixture({color: "보라색"})).success).toBe(false);
	});
});

describe("참고 이미지나 설명이 없으면 통째로 null", () => {
	it.each([["layout"], ["color"], ["fields"]])("%s가 null이어도 통과한다", (key) => {
		expect(createPromptResultForm.safeParse(resultFixture({[key]: null})).success).toBe(true);
	});
});

/* 환불 사유는 aihistory.reason에 그대로 들어간다(action은 항상 "refund"). 컬럼이
   VARCHAR라 DB가 값을 검사하지 않으므로, 여기서 목록 밖 값이 새면 그대로 저장된다. */
describe("toRefundReason", () => {
	it.each([
		[FinishReason.SAFETY, "safety"],
		[FinishReason.MAX_TOKENS, "max-tokens"],
		[FinishReason.PROHIBITED_CONTENT, "prohibited-content"],
		[FinishReason.MALFORMED_FUNCTION_CALL, "malformed-function-call"],
		[FinishReason.FINISH_REASON_UNSPECIFIED, "finish-reason-unspecified"],
	])("%s은 %s가 된다", (finishReason, expected) => {
		expect(toRefundReason(finishReason)).toBe(expected);
	});

	/* 구글이 새 finishReason을 추가했다고 환불 기록이 실패하면 안 된다. 기록을 못 남기는
	   것보다 뭉뚱그려 남기는 편이 낫다. */
	it("모르는 값은 other로 떨어뜨린다", () => {
		expect(toRefundReason("SOMETHING_NEW_FROM_GOOGLE")).toBe("other");
	});

	/* 이미지 생성용 사유는 목록에 없다. 지금 호출 형태에서는 나올 수 없지만,
	   나오더라도 기록은 남아야 한다. */
	it("목록에 없는 이미지용 사유도 삼킨다", () => {
		expect(toRefundReason(FinishReason.IMAGE_SAFETY)).toBe("other");
	});
});

describe("하루 한도", () => {
	/* aiDraftUsedCount·aiDraftCallCount는 둘 다 TinyInt다. 상한이 127을 넘으면
	   증가시키다가 저장이 깨진다. */
	it.each([
		["AI_DRAFT_DAILY_LIMIT", AI_DRAFT_DAILY_LIMIT],
		["AI_DRAFT_DAILY_CALL_LIMIT", AI_DRAFT_DAILY_CALL_LIMIT],
	])("%s는 TinyInt 범위 안이다", (_name, value) => {
		expect(value).toBeGreaterThan(0);
		expect(value).toBeLessThanOrEqual(127);
	});

	/* 호출 상한이 화면 한도보다 낮으면, 정상적으로 10회를 쓰려는 사용자가 먼저
	   호출 상한에 막힌다. 환불 여유를 위해 반드시 더 커야 한다. */
	it("호출 상한이 화면 한도보다 크다", () => {
		expect(AI_DRAFT_DAILY_CALL_LIMIT).toBeGreaterThan(AI_DRAFT_DAILY_LIMIT);
	});
});

/* 자정 초기화의 핵심 판정. 크론을 두지 않는 대신 "마지막으로 쓴 날이 오늘인가"로
   가르는데, 이게 틀리면 한도가 영영 안 풀리거나(영구 차단) 매 요청마다 풀린다(무제한). */
describe("remainingFrom", () => {
	it("한 번도 안 썼으면 상한 그대로", () => {
		expect(remainingFrom(null, 0)).toBe(AI_DRAFT_DAILY_LIMIT);
	});

	it("오늘 쓴 만큼 뺀다", () => {
		expect(remainingFrom(getKstToday(), 3)).toBe(AI_DRAFT_DAILY_LIMIT - 3);
	});

	it("어제 기록이면 오늘치는 그대로다 - 자정이 지나면 저절로 풀린다", () => {
		const yesterday = new Date(getKstToday().getTime() - 24 * 60 * 60 * 1000);

		expect(remainingFrom(yesterday, AI_DRAFT_DAILY_LIMIT)).toBe(AI_DRAFT_DAILY_LIMIT);
	});

	it("어긋난 값이 들어와도 음수는 안 나온다", () => {
		expect(remainingFrom(getKstToday(), AI_DRAFT_DAILY_LIMIT + 5)).toBe(0);
	});

	/* @db.Date 컬럼에 넣을 값이라 시각이 남아 있으면 안 된다. 시각이 섞이면
	   getTime() 비교가 매번 어긋나 초기화가 무한히 일어난다. */
	it("KST 오늘은 UTC 자정에 맞춰진 날짜다", () => {
		const today = getKstToday();

		expect(today.getUTCHours()).toBe(0);
		expect(today.getUTCMinutes()).toBe(0);
		expect(today.getUTCSeconds()).toBe(0);
		expect(today.getUTCMilliseconds()).toBe(0);
	});
});
