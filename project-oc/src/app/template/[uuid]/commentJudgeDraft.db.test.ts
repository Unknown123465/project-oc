import {afterAll, afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import db from "@/prisma/client";
import {claimCommentJudge} from "./commentJudgeDraft";

/* 요청 제한은 updateMany의 where로 판단하고 성공 여부는 실제로 바뀐 행 수로 읽어서 실제 DB를 탄다.
   시각은 Date만 가짜로 바꾼다. 타이머까지 바꾸면 드라이버의 소켓 처리가 멈춘다. */
const NOW: Date = new Date("2026-11-05T03:00:00.000Z");
const INTERVAL_MILLIS: number = 5 * 1000;

let userId: string;

/* 제한 상태가 User 행에 있어서 테스트마다 새 사용자를 쓴다. */
beforeEach(async () => {
	vi.useFakeTimers({toFake: ["Date"]});
	vi.setSystemTime(NOW);

	const user = await db.user.create({data: {name: "comment-judge-claim-test"}});
	userId = user.id;
});

afterEach(async () => {
	await db.user.delete({where: {id: userId}});
	vi.useRealTimers();
});

afterAll(async () => {
	await db.$disconnect();
});

function setClock(millis: number): void {
	vi.setSystemTime(new Date(Date.now() + millis));
}

describe("코멘트 요청 제한", () => {
	it("첫 요청 시 true를 반환하고, commentLastRequestAt 컬럼에 값이 저장되어야 한다", async () => {
		const claimResult = await claimCommentJudge(userId);

		expect(claimResult).toBe(true);

		const selectResult = await db.user.findUnique({
			where: {
				id: userId,
			},
			select: {
				commentLastRequestAt: true,
			},
		});

		expect(selectResult?.commentLastRequestAt).toEqual(NOW);
	});

	it("첫 요청 후, 5초 이내에 다시 요청하면 false를 반환해야 한다", async () => {
		const firstResult = await claimCommentJudge(userId);

		expect(firstResult, "첫 요청은 성공해야 한다").toBe(true);

		setClock(INTERVAL_MILLIS - 1);

		const secondResult = await claimCommentJudge(userId);

		expect(secondResult).toBe(false);
	});

	it("첫 요청 후, 5초가 지난 뒤 다시 요청하면 true를 반환해야 한다", async () => {
		const firstResult = await claimCommentJudge(userId);

		expect(firstResult, "첫 요청은 성공해야 한다").toBe(true);

		setClock(INTERVAL_MILLIS);

		const secondResult = await claimCommentJudge(userId);

		expect(secondResult).toBe(true);
	});

	it("5초 이내 재요청 등, 실패한 요청은 commentLastRequestAt 컬럼을 바꾸지 않아야 한다", async () => {
		const firstResult = await claimCommentJudge(userId);

		expect(firstResult, "첫 요청은 성공해야 한다").toBe(true);

		const firstSelectResult = await db.user.findUnique({
			where: {
				id: userId,
			},
			select: {
				commentLastRequestAt: true,
			},
		});

		expect(firstSelectResult?.commentLastRequestAt, "첫 요청이 성공했으니 commentLastRequestAt 컬럼에 값이 있어야 한다").toBeInstanceOf(Date);

		setClock(INTERVAL_MILLIS - 1);

		await claimCommentJudge(userId);

		const secondSelectResult = await db.user.findUnique({
			where: {
				id: userId,
			},
			select: {
				commentLastRequestAt: true,
			},
		});

		expect(secondSelectResult).not.toBeNull();

		expect(firstSelectResult?.commentLastRequestAt).toEqual(secondSelectResult?.commentLastRequestAt);
	});

	it("동시에 3번 요청하면 1번만 true를 반환해야 한다", async () => {
		const claimResult = await Promise.all([claimCommentJudge(userId), claimCommentJudge(userId), claimCommentJudge(userId)]);

		const trueCount: number = claimResult.reduce<number>((prev, current) => (current ? prev + 1 : prev), 0);

		expect(trueCount).toBe(1);
	});
});
