import {describe, expect, it} from "vitest";
import {escapeLike} from "./escapeLike";

describe("escapeLike", () => {
	it.each([
		["%", "\\%"],
		["_", "\\_"],
		["\\", "\\\\"],
		["100%", "100\\%"],
		["a_b%c\\d", "a\\_b\\%c\\\\d"],
		["%%__", "\\%\\%\\_\\_"],
	])("특수 문자가 든 %s 는 %s 로 바뀌어야 한다", (keyword, expected) => {
		expect(escapeLike(keyword)).toBe(expected);
	});

	it.each(["티아라", "Nova 7", "", "  "])("특수 문자가 없는 '%s' 는 그대로여야 한다", (keyword) => {
		expect(escapeLike(keyword)).toBe(keyword);
	});
});
