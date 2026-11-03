import {describe, expect, it} from "vitest";
import {toCommentTimeFormat} from "./commentTimeFormat";

const NOW: number = Date.parse("2026-11-02T03:00:00Z");

describe("상대 시간 경계", () => {
	it.each([
		{value: 0, result: "방금 전", label: "0초"},
		{value: 59, result: "방금 전", label: "59초"},
		{value: 60, result: "1분 전", label: "1분"},
		{value: 60 * 60 - 1, result: "59분 전", label: "59분 59초"},
		{value: 60 * 60, result: "1시간 전", label: "1시간"},
		{value: 60 * 60 * 24 - 1, result: "23시간 전", label: "23시간 59분 59초"},
		{value: 60 * 60 * 24, result: "1일 전", label: "1일"},
		{value: 60 * 60 * 24 * 7 - 1, result: "6일 전", label: "6일 23시간 59분 59초"},
		{value: 60 * 60 * 24 * 7, result: "7일 전", label: "7일"},
		{value: 60 * 60 * 24 * 8 - 1, result: "7일 전", label: "7일 23시간 59분 59초"},
		{value: 60 * 60 * 24 * 8, result: "11-02", label: "8일"},
	] as const)("코멘트를 작성한 지 $label 지나면 '$result'이(가) 반환되어야 한다", ({value, result}) => {
		const createdAt: Date = new Date(NOW);
		const nowValue: number = NOW + value * 1000;

		expect(toCommentTimeFormat(createdAt, nowValue, "Asia/Seoul")).toBe(result);
	});

	it("작성 시각이 지금보다 5초 뒤여도(기기 시계가 늦은 경우) '방금 전'이 반환되어야 한다", () => {
		const createdAt: Date = new Date(NOW);
		const nowValue: number = NOW - 5 * 1000;

		expect(toCommentTimeFormat(createdAt, nowValue, "Asia/Seoul")).toBe("방금 전");
	});
});

describe("날짜 표시", () => {
	it.each([
		{value: "2026-10-01T03:00:00Z", result: "10-01", label: "올해 10월 1일"},
		{value: "2025-12-31T03:00:00Z", result: "2025-12-31", label: "작년 12월 31일"},
	] as const)("8일 넘게 지난 코멘트를 '$label'에 작성했으면 '$result'이(가) 반환되어야 한다", ({value, result}) => {
		const createdAt: Date = new Date(value);

		expect(toCommentTimeFormat(createdAt, NOW, "Asia/Seoul")).toBe(result);
	});
});

describe("시간대 차이", () => {
	it.each([
		{now: NOW, createdAt: new Date("2026-10-20T16:00:00Z"), seoulResult: "10-21", newYorkResult: "10-20", nowLabel: "UTC 11-02 03:00", createdAtLabel: "UTC 10-20 16:00"},
		{
			now: Date.parse("2026-12-31T15:30:00Z"),
			createdAt: new Date("2026-12-20T16:00:00Z"),
			seoulResult: "2026-12-21",
			newYorkResult: "12-20",
			nowLabel: "UTC 12-31 15:30",
			createdAtLabel: "UTC 12-20 16:00",
		},
	] as const)(
		"지금이 '$nowLabel'이고 '$createdAtLabel'에 작성했으면 서울은 '$seoulResult', 뉴욕은 '$newYorkResult'이(가) 반환되어야 한다",
		({now, createdAt, seoulResult, newYorkResult}) => {
			expect(toCommentTimeFormat(createdAt, now, "Asia/Seoul")).toBe(seoulResult);
			expect(toCommentTimeFormat(createdAt, now, "America/New_York")).toBe(newYorkResult);
		}
	);
});
