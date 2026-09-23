import {afterAll, afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import db from "@/prisma/client";
import {claimAiDraft, refundAiDraft, type ClaimResult} from "./aiDraftUsage";
import {AI_DRAFT_DAILY_CALL_LIMIT, AI_DRAFT_DAILY_LIMIT, AI_DRAFT_MIN_CALL_INTERVAL_SECONDS, getKstToday} from "./validator";

/* claimAiDraft의 관문은 updateMany의 where 한 문장이고, 성공 여부는 실제로 바뀐 행 수로 읽는다.
   mock은 그 행 수를 테스트 작성자가 정하게 되어 아무것도 증명하지 못하므로 실제 DB를 탄다.

   시각은 Date만 가짜로 바꾼다. 관문의 기준 시각(오늘, 지금, 간격)이 전부 JS에서 계산되어
   DB로 넘어가기 때문에 Date만 바꾸면 되고, 타이머까지 바꾸면 드라이버의 소켓 처리가 멈춘다.
   간격 관문을 지나려면 요청 사이에 시계를 3초 넘게 돌리면 되므로 실제로 기다리지 않는다. */

/* 2026-09-22 정오(KST). 자정 근처가 아닌 시각이라 앞의 테스트들이 날짜 경계를 밟지 않는다. */
const NOON_KST: Date = new Date("2026-09-22T03:00:00.000Z");
const INTERVAL_MILLIS: number = AI_DRAFT_MIN_CALL_INTERVAL_SECONDS * 1000 + 100;

let userId: string;

/* 테스트마다 새 사용자. 관문의 상태가 전부 User 행에 있어 사용자를 바꾸면 상태가 초기화된다. */
beforeEach(async () => {
	vi.useFakeTimers({toFake: ["Date"]});
	vi.setSystemTime(NOON_KST);

	const user = await db.user.create({data: {name: "ai-draft-usage-test"}});
	userId = user.id;
});

afterEach(async () => {
	/* AiHistory → User 관계에 onDelete가 없어 이력부터 지운다. */
	await db.aiHistory.deleteMany({where: {userId}});
	await db.user.delete({where: {id: userId}});
	vi.useRealTimers();
});

afterAll(async () => {
	await db.$disconnect();
});

async function readUsage() {
	return db.user.findUniqueOrThrow({
		where: {id: userId},
		select: {aiDraftUsedOn: true, aiDraftUsedCount: true, aiDraftCallCount: true, aiDraftLastCallAt: true},
	});
}

function advanceClock(millis: number): void {
	vi.setSystemTime(new Date(Date.now() + millis));
}

describe("동시 요청", () => {
	it("오늘 첫 호출인 사용자가 3번을 동시에 보내면 1번만 통과하고 나머지는 too-fast다", async () => {
		const results: ClaimResult[] = await Promise.all([claimAiDraft(userId), claimAiDraft(userId), claimAiDraft(userId)]);

		const passed: ClaimResult[] = results.filter((result) => result.ok);
		const rejected: ClaimResult[] = results.filter((result) => !result.ok);

		expect(passed).toHaveLength(1);
		expect(rejected).toHaveLength(2);
		expect(rejected.every((result) => !result.ok && result.reason === "too-fast")).toBe(true);

		/* 통과한 한 번만 기록됐는지. 거절된 요청이 카운트나 이력을 남기면 안 된다. */
		const usage = await readUsage();
		expect(usage.aiDraftUsedCount).toBe(1);
		expect(usage.aiDraftCallCount).toBe(1);
		await expect(db.aiHistory.count({where: {userId, action: "use"}})).resolves.toBe(1);
	});
});

describe("관문별 거절 사유", () => {
	it("사용 횟수가 8이면 두 번 더 통과하고 세 번째는 exhausted다", async () => {
		await db.user.update({
			where: {id: userId},
			data: {aiDraftUsedOn: getKstToday(), aiDraftUsedCount: AI_DRAFT_DAILY_LIMIT - 2},
		});

		const first: ClaimResult = await claimAiDraft(userId);
		advanceClock(INTERVAL_MILLIS);
		const second: ClaimResult = await claimAiDraft(userId);
		advanceClock(INTERVAL_MILLIS);
		const third: ClaimResult = await claimAiDraft(userId);

		expect(first).toEqual({ok: true, remaining: 1});
		expect(second).toEqual({ok: true, remaining: 0});
		expect(third).toEqual({ok: false, reason: "exhausted", remaining: 0});
	});

	it("호출 횟수가 28이면 두 번 더 통과하고 세 번째는 call-limit이다", async () => {
		await db.user.update({
			where: {id: userId},
			data: {aiDraftUsedOn: getKstToday(), aiDraftUsedCount: 0, aiDraftCallCount: AI_DRAFT_DAILY_CALL_LIMIT - 2},
		});

		const first: ClaimResult = await claimAiDraft(userId);
		advanceClock(INTERVAL_MILLIS);
		const second: ClaimResult = await claimAiDraft(userId);
		advanceClock(INTERVAL_MILLIS);
		const third: ClaimResult = await claimAiDraft(userId);

		expect(first.ok).toBe(true);
		expect(second.ok).toBe(true);
		/* 남은 횟수는 8인데 거절된다. 화면의 한도와 실제 호출 상한이 따로라는 것이 이 줄이다. */
		expect(third).toEqual({ok: false, reason: "call-limit", remaining: 0});
	});
});

describe("날짜 변경", () => {
	it("자정을 넘긴 요청은 오늘치를 0에서 다시 세어 1이 된다", async () => {
		vi.setSystemTime(new Date("2026-09-22T14:59:50.000Z")); // 23:59:50 KST
		const beforeMidnight: ClaimResult = await claimAiDraft(userId);
		expect(beforeMidnight.ok).toBe(true);

		vi.setSystemTime(new Date("2026-09-22T15:00:01.000Z")); // 다음 날 00:00:01 KST
		const afterMidnight: ClaimResult = await claimAiDraft(userId);
		expect(afterMidnight).toEqual({ok: true, remaining: AI_DRAFT_DAILY_LIMIT - 1});

		/* 초기화가 됐다면 2가 아니라 1이다. 트랜잭션 안의 0은 밖에서 볼 수 없으니 끝 상태로 판정한다. */
		const usage = await readUsage();
		expect(usage.aiDraftUsedOn).toEqual(new Date("2026-09-23T00:00:00.000Z"));
		expect(usage.aiDraftUsedCount).toBe(1);
		expect(usage.aiDraftCallCount).toBe(1);
	});
});

describe("환불", () => {
	it("결과를 못 준 요청은 사용 횟수만 돌려주고 호출 횟수는 그대로 둔다", async () => {
		const claim: ClaimResult = await claimAiDraft(userId);
		expect(claim.ok).toBe(true);

		const remaining: number | undefined = await refundAiDraft(userId, "server-error");
		expect(remaining).toBe(AI_DRAFT_DAILY_LIMIT);

		const usage = await readUsage();
		expect(usage.aiDraftUsedCount).toBe(0);
		expect(usage.aiDraftCallCount).toBe(1);

		await expect(db.aiHistory.count({where: {userId, action: "use"}})).resolves.toBe(1);
		await expect(db.aiHistory.findMany({where: {userId, action: "refund"}, select: {reason: true}})).resolves.toEqual([{reason: "server-error"}]);
	});
});
