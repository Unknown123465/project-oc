import {describe, expect, it} from "vitest";
import {v7 as uuidv7} from "uuid";
import {binToUuid, uuidToBin} from "./uuid";

/* charPublicLink는 BINARY(16)이라 쓸 때와 읽을 때 형태가 다르다.
   두 함수가 서로의 역이 아니게 되는 순간 공개 링크가 통째로 어긋난다. */

describe("왕복 변환", () => {
	it("UUIDv7을 넣었다 빼도 같은 값이다", () => {
		for (let i = 0; i < 100; i += 1) {
			const uuid: string = uuidv7();

			expect(binToUuid(uuidToBin(uuid))).toBe(uuid);
		}
	});

	it("항상 16바이트로 줄어든다", () => {
		expect(uuidToBin(uuidv7())).toHaveLength(16);
	});

	/* Prisma의 Bytes 컬럼이 받는 타입. Buffer로 넘기면 Node 타입 정의에 따라
	   ArrayBufferLike 불일치가 나므로 Uint8Array로 고정한다. */
	it("Prisma가 받는 Uint8Array로 나온다", () => {
		expect(uuidToBin(uuidv7())).toBeInstanceOf(Uint8Array);
	});

	it("대문자로 넣어도 소문자 표준형으로 돌아온다", () => {
		const uuid: string = "0F8FAD5B-D9CB-469F-A165-70867728950E";

		expect(binToUuid(uuidToBin(uuid))).toBe(uuid.toLowerCase());
	});

	it("8-4-4-4-12로 끊는다", () => {
		expect(binToUuid(uuidToBin("0f8fad5b-d9cb-469f-a165-70867728950e"))).toBe("0f8fad5b-d9cb-469f-a165-70867728950e");
	});
});

describe("잘못된 입력", () => {
	/* "한 자 넘침"이 이 검사의 이유다. Buffer.from(_, "hex")에 맡기면 33자리는
	   남는 반 바이트만 버려져 정확히 16바이트가 나오고, 결과 길이만 보는 검사는
	   그걸 통과시킨다. 실제로 이 테스트가 그 상태를 잡아냈다. */
	it.each([
		["0f8fad5b-d9cb-469f-a165-70867728950", "한 자 모자람"],
		["0f8fad5b-d9cb-469f-a165-70867728950ee", "한 자 넘침"],
		["zzzzzzzz-d9cb-469f-a165-70867728950e", "16진수 아님"],
		["", "빈 문자열"],
		["not-a-uuid", "형식 아님"],
	])("%s 는 조용히 잘리지 않고 예외가 된다 (%s)", (uuid) => {
		expect(() => uuidToBin(uuid)).toThrow();
	});

	it.each([
		[15, "짧은 바이트열"],
		[17, "긴 바이트열"],
		[0, "빈 바이트열"],
	])("%i바이트는 UUID로 읽지 않는다 (%s)", (length) => {
		expect(() => binToUuid(new Uint8Array(length))).toThrow();
	});
});
