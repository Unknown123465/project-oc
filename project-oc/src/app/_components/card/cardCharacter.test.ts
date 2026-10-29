import {describe, expect, it} from "vitest";
import {colorCorrection, toCharFileName} from "./cardCharacter";

describe("글자색 보정", () => {
	it.each(["#b0465b", "#000000"] as const)("이미 기준을 넘는 색(%s)을 넣으면 textType과 상관없이 그대로 돌려줘야 한다", (value) => {
		expect(colorCorrection(value, "bigText"), "bigText는 그대로여야 한다").toBe(value);
		expect(colorCorrection(value, "other"), "other는 그대로여야 한다").toBe(value);
	});

	it.each([
		{value: "#ffafbd", bigTextResult: "#cc7c8a", otherResult: "#ab5b69"},
		{value: "#ffc90e", bigTextResult: "#c08a00", otherResult: "#9f6900"},
		{value: "#a8e6cf", bigTextResult: "#63a18a", otherResult: "#44826b"},
		{value: "#ffffff", bigTextResult: "#939393", otherResult: "#737373"},
	] as const)("기준에 못 미치는 색($value)을 넣으면 bigText는 $bigTextResult, other는 $otherResult여야 한다", ({value, bigTextResult, otherResult}) => {
		expect(colorCorrection(value, "bigText"), `bigText는 ${bigTextResult}여야 한다`).toBe(bigTextResult);
		expect(colorCorrection(value, "other"), `other는 ${otherResult}여야 한다`).toBe(otherResult);
	});

	it("큰 글자 기준만 넘는 색(#c0607a)을 넣으면 bigText는 그대로, other는 #b4546e여야 한다", () => {
		expect(colorCorrection("#c0607a", "bigText"), "bigText는 그대로여야 한다").toBe("#c0607a");
		expect(colorCorrection("#c0607a", "other"), "other는 #b4546e여야 한다").toBe("#b4546e");
	});

	it("대문자 색(#FFAFBD)을 넣어도 결과가 소문자와 같고, # 뒤에 소문자 16진수 6자리여야 한다", () => {
		expect(colorCorrection("#FFAFBD", "bigText")).toMatch(/^#[0-9a-f]{6}$/);
		expect(colorCorrection("#FFAFBD", "bigText")).toBe(colorCorrection("#ffafbd", "bigText"));
	});
});

describe("PNG 파일 이름", () => {
	it('이름(티아라)을 넣으면 "티아라 카드 - 프로젝트 OC.png"여야 한다', () => {
		expect(toCharFileName("티아라")).toBe("티아라 카드 - 프로젝트 OC.png");
	});

	it.each([
		{value: "가/나:다", result: "가나다 카드 - 프로젝트 OC.png"},
		{value: 'a<b>c"d|e?f\\g', result: "abcdefg 카드 - 프로젝트 OC.png"},
		{value: "a\u0007b", result: "ab 카드 - 프로젝트 OC.png"},
		{value: "/ 티아라", result: "티아라 카드 - 프로젝트 OC.png"},
	] as const)('못 쓰는 글자가 섞인 이름을 넣으면 그 글자를 지운 "$result"여야 한다', ({value, result}) => {
		expect(toCharFileName(value)).toBe(result);
	});

	it.each(["/:*?", "\u0000\u001f", "/ :"] as const)('못 쓰는 글자만 있는 이름(%s)을 넣으면 "프로필 카드 - 프로젝트 OC.png"여야 한다', (value) => {
		expect(toCharFileName(value)).toBe("프로필 카드 - 프로젝트 OC.png");
	});
});
