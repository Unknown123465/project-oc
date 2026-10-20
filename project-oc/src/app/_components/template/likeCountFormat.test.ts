import {describe, expect, it} from "vitest";
import {applyLikeFormat} from "./likeCountFormat";

describe("1,000 미만", () => {
	it.each([
		{value: 0, result: "0"},
		{value: 999, result: "999"},
	] as const)("$value은(는) $result(으)로 표시되어야 한다", ({value, result}) => {
		expect(applyLikeFormat(value)).toBe(result);
	});
});

describe("k 단위", () => {
	it.each([
		{value: 1000, result: "1k"},
		{value: 1050, result: "1k"},
		{value: 1099, result: "1k"},
		{value: 1950, result: "1.9k"},
		{value: 1100, result: "1.1k"},
		{value: 9999, result: "9.9k"},
		{value: 999999, result: "999.9k"},
	] as const)("$value은(는) $result(으)로 표시되어야 한다", ({value, result}) => {
		expect(applyLikeFormat(value)).toBe(result);
	});
});

describe("m 단위", () => {
	it.each([{value: 1000000, result: "1m"}] as const)("$value은(는) $result(으)로 표시되어야 한다", ({value, result}) => {
		expect(applyLikeFormat(value)).toBe(result);
	});
});
