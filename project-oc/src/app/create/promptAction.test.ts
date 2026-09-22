import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {FinishReason} from "@google/genai";
import {AI_DRAFT_DISABLED_MESSAGE, AI_DRAFT_EXHAUSTED_MESSAGE} from "./validator";
import {resultFixture} from "./promptResult.fixture";

/* 킬 스위치가 서버 액션의 어느 자리에 있는지를 고정한다. 로그인·입력 검증 뒤,
   횟수 차감 앞. 차감 뒤로 밀리면 꺼진 동안 눌러 본 사용자의 하루 횟수가 줄어든다. */

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	getAiDraftEnabled: vi.fn(),
	claimAiDraft: vi.fn(),
	refundAiDraft: vi.fn(),
	generateContent: vi.fn(),
}));

vi.mock("@/auth/auth", () => ({auth: mocks.auth}));
vi.mock("./globalConfig", () => ({getAiDraftEnabled: mocks.getAiDraftEnabled}));
vi.mock("./aiDraftUsage", () => ({claimAiDraft: mocks.claimAiDraft, refundAiDraft: mocks.refundAiDraft}));

/* 열거형(HarmCategory 등)은 모듈 로드 때 쓰이므로 원본을 살리고, 실제 요청을 보내는
   클라이언트 클래스만 바꿔 끼운다. */
vi.mock("@google/genai", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@google/genai")>();

	return {
		...actual,
		GoogleGenAI: class {
			models = {generateContent: mocks.generateContent};
		},
	};
});

const USER_ID: string = "clx0000000000000000000000";
const INPUT = {profile: "테스트 캐릭터"} as const;

beforeEach(() => {
	mocks.auth.mockResolvedValue({user: {id: USER_ID}});
	mocks.claimAiDraft.mockResolvedValue({ok: false, reason: "exhausted", remaining: 0});

	vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
	vi.resetAllMocks();
	vi.restoreAllMocks();
});

describe("킬 스위치 관문", () => {
	it("꺼져 있으면 전용 문구로 거절하고 횟수를 차감하지 않는다", async () => {
		mocks.getAiDraftEnabled.mockResolvedValue(false);

		const {default: createPromptAction} = await import("./promptAction");
		const result = await createPromptAction(INPUT);

		expect(result).toEqual({success: false, message: AI_DRAFT_DISABLED_MESSAGE});
		expect(mocks.claimAiDraft).not.toHaveBeenCalled();
		expect(mocks.generateContent).not.toHaveBeenCalled();
	});

	/* 차감 단계가 "다 썼다"고 답하게 해 두면 관문을 지났다는 사실만 떼어 볼 수 있다.
	   모델 응답까지 흉내 내면 응답 스키마에 묶여 이 테스트가 다른 이유로 깨진다. */
	it("켜져 있으면 관문을 지나 횟수 차감 단계로 간다", async () => {
		mocks.getAiDraftEnabled.mockResolvedValue(true);

		const {default: createPromptAction} = await import("./promptAction");
		const result = await createPromptAction(INPUT);

		expect(mocks.claimAiDraft).toHaveBeenCalledWith(USER_ID);
		expect(result).toMatchObject({success: false, message: AI_DRAFT_EXHAUSTED_MESSAGE});
	});

	it("비로그인 요청은 스위치를 읽기 전에 거절된다", async () => {
		mocks.auth.mockResolvedValue(null);

		const {default: createPromptAction} = await import("./promptAction");
		const result = await createPromptAction(INPUT);

		expect(result).toMatchObject({success: false});
		expect(mocks.getAiDraftEnabled).not.toHaveBeenCalled();
	});
});

/* 이슈 #41. 보내지 않은 입력에 대한 응답 항목은 서버가 버려야 한다 — 프롬프트에
   "설명이 없으면 fields는 null" 지시가 있어도 모델이 어겼고(이미지만 보냈는데 종족
   "곰"), 화면은 서버가 준 값을 그대로 그리므로 여기가 마지막 방어선이다.

   버리는 것은 오류가 아니다. 사용자가 보낸 쪽의 결과는 정상이라 성공 응답이고 횟수도
   그대로 차감된다. 그래서 refundAiDraft가 불리지 않는 것까지 같이 본다. */
describe("보내지 않은 입력에 대한 응답 항목은 버린다", () => {
	const REMAINING: number = 9;
	const IMAGE: File = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "frosty.png", {type: "image/png"});

	/* 모델이 세 항목을 전부 채워 돌려준 응답. 어떤 입력을 보냈든 같은 응답을 주게 해서,
	   무엇이 남고 무엇이 버려지는지가 입력 조합만으로 갈리게 한다. */
	function respondWithEverything() {
		mocks.generateContent.mockResolvedValue({
			text: JSON.stringify(resultFixture()),
			candidates: [{finishReason: FinishReason.STOP}],
		});
	}

	beforeEach(() => {
		mocks.getAiDraftEnabled.mockResolvedValue(true);
		mocks.claimAiDraft.mockResolvedValue({ok: true, remaining: REMAINING});
		respondWithEverything();
	});

	it("설명만 보내면 layout과 color를 null로 바꾸고 fields는 남긴다", async () => {
		const {default: createPromptAction} = await import("./promptAction");
		const result = await createPromptAction({profile: "곰 캐릭터 프로스티"});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.result.layout).toBeNull();
		expect(result.result.color).toBeNull();
		expect(result.result.fields?.charName.value).toBe("세라핀");
	});

	it("이미지만 보내면 fields를 null로 바꾸고 layout과 color는 남긴다", async () => {
		const {default: createPromptAction} = await import("./promptAction");
		const result = await createPromptAction({image: IMAGE});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.result.fields).toBeNull();
		expect(result.result.layout?.type).toBe("s");
		expect(result.result.color).toBe("#7c5cff");
	});

	/* 공백뿐인 설명은 contents에 실리지 않으므로 "설명 없음"과 같아야 한다.
	   profile 유무로 판정하면 이 경우가 새어 나간다. */
	it("공백만 있는 설명은 설명이 없는 것으로 보고 fields를 버린다", async () => {
		const {default: createPromptAction} = await import("./promptAction");
		const result = await createPromptAction({profile: "   ", image: IMAGE});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.result.fields).toBeNull();
		expect(result.result.layout).not.toBeNull();
	});

	it("둘 다 보내면 아무것도 버리지 않는다", async () => {
		const {default: createPromptAction} = await import("./promptAction");
		const result = await createPromptAction({profile: "곰 캐릭터 프로스티", image: IMAGE});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.result.fields).not.toBeNull();
		expect(result.result.layout).not.toBeNull();
		expect(result.result.color).not.toBeNull();
	});

	it("버리는 것은 오류가 아니다 — 환불하지 않고 차감된 남은 횟수를 그대로 돌려준다", async () => {
		const {default: createPromptAction} = await import("./promptAction");
		const result = await createPromptAction({image: IMAGE});

		expect(result).toMatchObject({success: true, remainingToday: REMAINING});
		expect(mocks.refundAiDraft).not.toHaveBeenCalled();
	});

	/* 조용히 버리면 모델이 지시를 얼마나 자주 어기는지 알 길이 없다. 값은 찍지 않고
	   어느 항목을 버렸는지만 남긴다 — 사용자 설명이 로그에 실리면 안 된다. */
	it("버린 항목마다 경고를 한 줄 남긴다", async () => {
		const {default: createPromptAction} = await import("./promptAction");

		await createPromptAction({profile: "곰 캐릭터 프로스티"});

		expect(console.warn).toHaveBeenCalledTimes(2);
	});
});

/* 이슈 #45. 차감은 AI를 부르기 전에 일어나므로, 결과를 못 주고 끝나는 모든 경로는 환불로
   되돌려야 한다. 위 describe는 "환불하지 않는다"만 보고 있어 반대쪽이 비어 있었다.
   실패 경로는 셋으로 갈린다 - 호출 자체가 던짐, 응답이 거부됨, 응답이 스키마와 어긋남.
   환불이 실제로 DB를 되돌리는지는 aiDraftUsage.db.test.ts가 보고, 여기서는 "한 번 불렸고
   그 반환값이 응답에 실리는지"만 본다. */
describe("결과를 못 준 요청은 환불한다", () => {
	const REFUNDED_REMAINING: number = 10;

	beforeEach(() => {
		mocks.getAiDraftEnabled.mockResolvedValue(true);
		mocks.claimAiDraft.mockResolvedValue({ok: true, remaining: 9});
		mocks.refundAiDraft.mockResolvedValue(REFUNDED_REMAINING);

		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("AI 호출이 던지면 server-error로 한 번 환불하고 돌려받은 남은 횟수를 응답에 싣는다", async () => {
		mocks.generateContent.mockRejectedValue(new Error("network down"));

		const {default: createPromptAction} = await import("./promptAction");
		const result = await createPromptAction(INPUT);

		expect(result).toMatchObject({success: false, remainingToday: REFUNDED_REMAINING});
		expect(mocks.refundAiDraft).toHaveBeenCalledTimes(1);
		expect(mocks.refundAiDraft).toHaveBeenCalledWith(USER_ID, "server-error");
	});

	it("입력이 차단되면 blocked로 한 번 환불한다", async () => {
		mocks.generateContent.mockResolvedValue({promptFeedback: {blockReason: "PROHIBITED_CONTENT"}});

		const {default: createPromptAction} = await import("./promptAction");
		const result = await createPromptAction(INPUT);

		expect(result).toMatchObject({success: false, remainingToday: REFUNDED_REMAINING});
		expect(mocks.refundAiDraft).toHaveBeenCalledTimes(1);
		expect(mocks.refundAiDraft).toHaveBeenCalledWith(USER_ID, "blocked");
	});

	it("응답이 스키마와 어긋나면 server-error로 한 번 환불한다", async () => {
		mocks.generateContent.mockResolvedValue({
			text: JSON.stringify({fields: "not-an-object"}),
			candidates: [{finishReason: FinishReason.STOP}],
		});

		const {default: createPromptAction} = await import("./promptAction");
		const result = await createPromptAction(INPUT);

		expect(result).toMatchObject({success: false, remainingToday: REFUNDED_REMAINING});
		expect(mocks.refundAiDraft).toHaveBeenCalledTimes(1);
		expect(mocks.refundAiDraft).toHaveBeenCalledWith(USER_ID, "server-error");
	});
});
