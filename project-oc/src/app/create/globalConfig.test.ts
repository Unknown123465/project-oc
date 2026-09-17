import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

/* 이 파일이 지키는 건 킬 스위치의 기본 방향 하나다 - 스위치를 읽을 수 없으면 켜진 것으로
   본다. 설정 저장소 장애가 멀쩡한 기능을 죽이면 안 되기 때문인데, 그 대신 저장소 장애
   중에는 스위치를 쓸 수 없다는 점을 감수한다. 판정을 반대로 뒤집으면 여기서 막혀야 한다. */

const mocks = vi.hoisted(() => ({
	createClient: vi.fn(),
	get: vi.fn(),
}));

vi.mock("@vercel/global-config", () => ({
	createClient: mocks.createClient,
}));

const CONNECTION_STRING: string = "https://global-config.vercel.com/ecfg_test?token=test";

/* 클라이언트는 모듈 로드 때 한 번 만들어지므로, 연결 문자열 유무를 바꿔 보려면
   모듈 캐시를 비우고 매번 새로 들여와야 한다. */
async function loadGetAiDraftEnabled() {
	vi.resetModules();

	const {getAiDraftEnabled} = await import("./globalConfig");

	return getAiDraftEnabled;
}

beforeEach(() => {
	process.env.VERCEL_CONFIG_STORE_URL = CONNECTION_STRING;

	mocks.createClient.mockReset().mockReturnValue({get: mocks.get});
	mocks.get.mockReset();

	vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
	delete process.env.VERCEL_CONFIG_STORE_URL;

	vi.restoreAllMocks();
});

describe("AI_DRAFT_ENABLED 판정", () => {
	it("true면 켜짐", async () => {
		mocks.get.mockResolvedValue(true);

		const getAiDraftEnabled = await loadGetAiDraftEnabled();

		await expect(getAiDraftEnabled()).resolves.toBe(true);
		expect(mocks.get).toHaveBeenCalledWith("AI_DRAFT_ENABLED");
	});

	it("false면 꺼짐", async () => {
		mocks.get.mockResolvedValue(false);

		const getAiDraftEnabled = await loadGetAiDraftEnabled();

		await expect(getAiDraftEnabled()).resolves.toBe(false);
	});

	it("항목이 없으면 켜짐", async () => {
		mocks.get.mockResolvedValue(undefined);

		const getAiDraftEnabled = await loadGetAiDraftEnabled();

		await expect(getAiDraftEnabled()).resolves.toBe(true);
	});

	/* 조용히 켜지면 운영에서 스위치가 안 먹는 걸 끄려 할 때에야 알게 된다.
	   켜진 것으로 처리하되 로그는 남아야 한다. */
	it("읽기에 실패하면 켜짐으로 처리하고 경고를 남긴다", async () => {
		mocks.get.mockRejectedValue(new Error("network"));

		const getAiDraftEnabled = await loadGetAiDraftEnabled();

		await expect(getAiDraftEnabled()).resolves.toBe(true);
		expect(console.warn).toHaveBeenCalledTimes(1);
	});
});

describe("연결 문자열이 없을 때", () => {
	/* CI와 로컬 첫 실행이 이 상태다. 클라이언트 생성이 실패해도 모듈 로드가 죽지 않고,
	   읽기를 시도조차 하지 않은 채 켜진 것으로 본다. */
	it("클라이언트를 만들지 못해도 켜짐으로 처리하고 경고를 남긴다", async () => {
		delete process.env.VERCEL_CONFIG_STORE_URL;
		mocks.createClient.mockImplementation(() => {
			throw new Error("No connection string provided");
		});

		const getAiDraftEnabled = await loadGetAiDraftEnabled();

		await expect(getAiDraftEnabled()).resolves.toBe(true);
		expect(mocks.get).not.toHaveBeenCalled();
		expect(console.warn).toHaveBeenCalledTimes(1);
	});
});
