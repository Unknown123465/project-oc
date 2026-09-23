import {afterAll, describe, expect, it} from "vitest";
import db from "./client";

/* DB 테스트 발판이 서 있는지만 본다. 컨테이너, db push, 테스트 DB 이름 주입이 전부 이 한 줄에 걸린다.
   진짜 테스트를 쓰기 전에 이게 CI에서 초록이어야 뒤의 실패가 발판 문제인지 테스트 문제인지 가릴 수 있다. */

afterAll(async () => {
	await db.$disconnect();
});

describe("테스트 DB 연결", () => {
	it("테스트 전용 DB 이름으로 붙어 User 테이블을 읽는다", async () => {
		expect(process.env.DATABASE_NAME).toBe(process.env.DATABASE_TEST_NAME);
		await expect(db.user.count()).resolves.toBeTypeOf("number");
	});
});
