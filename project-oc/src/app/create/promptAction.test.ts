import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {AI_DRAFT_DISABLED_MESSAGE, AI_DRAFT_EXHAUSTED_MESSAGE} from "./validator";

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
