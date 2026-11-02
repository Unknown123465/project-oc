import {describe, expect, it} from "vitest";
import {COMMENT_MAX_LENGTH, deleteOrHiddenCommentForm, editCommentForm, EMPTY_COMMENT_MESSAGE, MAX_LENGTH_MESSAGE, writeCommentForm, WRONG_COMMENT_ID_MESSAGE, WRONG_UUID_MESSAGE} from "./validator";

const TEST_UUID = "01a194aa-c914-7530-b090-df24923178fd" as const;
const TEST_COMMENT_ID = 1000n as const;

describe("공백 체크", () => {
	it.each([
		{value: " ".repeat(10), label: "일반 공백"},
		{value: "\u115f\u1160\u3164", label: "특수 공백"},
		{value: "\u200d", label: "ZWJ"},
		{value: "\ufe0f\ufe0f", label: "변형 선택자"},
	] as const)("공백($label)만 입력하면 통과되지 말아야 하고, 코멘트를 입력해 달라는 메시지가 나와야 한다", ({value}) => {
		const writeResult = writeCommentForm.safeParse({
			uuid: TEST_UUID,
			comment: value,
		});
		const editResult = editCommentForm.safeParse({
			uuid: TEST_UUID,
			commentId: TEST_COMMENT_ID,
			comment: value,
		});

		expect(writeResult.error?.issues[0].message).toBe(EMPTY_COMMENT_MESSAGE);
		expect(editResult.error?.issues[0].message).toBe(EMPTY_COMMENT_MESSAGE);
	});

	it.each([
		{value: "가나다", blank: " ".repeat(10), label: "일반 공백"},
		{value: "abc", blank: "\u115f\u1160\u3164", label: "특수 공백"},
		{value: "코멘트", blank: "\u200d", label: "ZWJ"},
	] as const)("앞뒤에 공백($label)을 넣으면 정리된 뒤 '$value'만 남아야 한다", ({value, blank}) => {
		const comment: string = blank + value + blank;

		const writeResult = writeCommentForm.safeParse({
			uuid: TEST_UUID,
			comment,
		});
		const editResult = editCommentForm.safeParse({
			uuid: TEST_UUID,
			commentId: TEST_COMMENT_ID,
			comment,
		});

		expect(writeResult.data?.comment).toStrictEqual(value);
		expect(editResult.data?.comment).toStrictEqual(value);
	});

	it(`${COMMENT_MAX_LENGTH.normal}자 코멘트는 통과해야 한다`, () => {
		const comment: string = "가".repeat(COMMENT_MAX_LENGTH.normal);

		const writeResult = writeCommentForm.safeParse({
			uuid: TEST_UUID,
			comment,
		});
		const editResult = editCommentForm.safeParse({
			uuid: TEST_UUID,
			commentId: TEST_COMMENT_ID,
			comment,
		});

		expect(writeResult.success).toBe(true);
		expect(editResult.success).toBe(true);
	});

	it(`${COMMENT_MAX_LENGTH.normal}자를 넘는 코멘트는 통과되지 말아야 한다`, () => {
		const comment: string = "가".repeat(COMMENT_MAX_LENGTH.normal + 1);

		const writeResult = writeCommentForm.safeParse({
			uuid: TEST_UUID,
			comment,
		});
		const editResult = editCommentForm.safeParse({
			uuid: TEST_UUID,
			commentId: TEST_COMMENT_ID,
			comment,
		});

		expect(writeResult.error?.issues[0].message).toBe(MAX_LENGTH_MESSAGE.normal);
		expect(editResult.error?.issues[0].message).toBe(MAX_LENGTH_MESSAGE.normal);
	});

	it(`앞뒤 공백 때문에 ${COMMENT_MAX_LENGTH.beforeErase.toLocaleString("ko")}자를 넘으면 정리하기 전에 막혀야 한다`, () => {
		const blank: string = " ".repeat(Math.ceil(COMMENT_MAX_LENGTH.beforeErase / 2));
		const comment: string = blank + "코멘트" + blank;

		const writeResult = writeCommentForm.safeParse({
			uuid: TEST_UUID,
			comment,
		});
		const editResult = editCommentForm.safeParse({
			uuid: TEST_UUID,
			commentId: TEST_COMMENT_ID,
			comment,
		});

		expect(writeResult.error?.issues[0].message).toBe(MAX_LENGTH_MESSAGE.beforeErase);
		expect(editResult.error?.issues[0].message).toBe(MAX_LENGTH_MESSAGE.beforeErase);
	});
});

describe("uuid 체크", () => {
	it.each(["wrong-uuid-value", TEST_UUID.replaceAll(/\d/g, "가"), TEST_UUID + "aaaaaa", [TEST_UUID]] as const)("올바르지 않은 uuid(%s)를 넘기면 통과되지 말아야 한다", (value) => {
		const comment: string = "테스트 코멘트";

		const writeResult = writeCommentForm.safeParse({
			uuid: value,
			comment,
		});
		const editResult = editCommentForm.safeParse({
			uuid: value,
			commentId: TEST_COMMENT_ID,
			comment,
		});
		const deleteOrHiddenResult = deleteOrHiddenCommentForm.safeParse({
			uuid: value,
			commentId: TEST_COMMENT_ID,
			comment,
		});

		expect(writeResult.error?.issues[0].message).toBe(WRONG_UUID_MESSAGE);
		expect(editResult.error?.issues[0].message).toBe(WRONG_UUID_MESSAGE);
		expect(deleteOrHiddenResult.error?.issues[0].message).toBe(WRONG_UUID_MESSAGE);
	});
});

describe("commentId 체크", () => {
	it("commentId가 숫자 문자열이면 bigint로 바뀌어야 한다", () => {
		const commentId: string = TEST_COMMENT_ID.toString();

		const editResult = editCommentForm.safeParse({
			uuid: TEST_UUID,
			commentId,
			comment: "수정될 코멘트",
		});
		const deleteOrHiddenResult = deleteOrHiddenCommentForm.safeParse({
			uuid: TEST_UUID,
			commentId,
		});

		expect(editResult.data?.commentId).toBe(TEST_COMMENT_ID);
		expect(deleteOrHiddenResult.data?.commentId).toBe(TEST_COMMENT_ID);
	});

	it.each(["abc", "1.5", "1000n", "", " ", "0"] as const)("commentId가 '%s'이면 통과되지 말아야 한다", (value) => {
		const editResult = editCommentForm.safeParse({
			uuid: TEST_UUID,
			commentId: value,
			comment: "수정될 코멘트",
		});
		const deleteOrHiddenResult = deleteOrHiddenCommentForm.safeParse({
			uuid: TEST_UUID,
			commentId: value,
		});

		expect(editResult.error?.issues[0].message).toBe(WRONG_COMMENT_ID_MESSAGE);
		expect(deleteOrHiddenResult.error?.issues[0].message).toBe(WRONG_COMMENT_ID_MESSAGE);
	});

	it.each([65, 5.3, null] as const)("commentId가 문자열이 아닌 %s이면 통과되지 말아야 한다", (value) => {
		const editResult = editCommentForm.safeParse({
			uuid: TEST_UUID,
			commentId: value,
			comment: "수정될 코멘트",
		});
		const deleteOrHiddenResult = deleteOrHiddenCommentForm.safeParse({
			uuid: TEST_UUID,
			commentId: value,
		});

		expect(editResult.error?.issues[0].message).toBe(WRONG_COMMENT_ID_MESSAGE);
		expect(deleteOrHiddenResult.error?.issues[0].message).toBe(WRONG_COMMENT_ID_MESSAGE);
	});

	it.each([0n, -1n] as const)("commentId가 양수가 아닌 bigint(%s)이면 통과되지 말아야 한다", (value) => {
		const editResult = editCommentForm.safeParse({
			uuid: TEST_UUID,
			commentId: value,
			comment: "수정될 코멘트",
		});
		const deleteOrHiddenResult = deleteOrHiddenCommentForm.safeParse({
			uuid: TEST_UUID,
			commentId: value,
		});

		expect(editResult.error?.issues[0].message).toBe(WRONG_COMMENT_ID_MESSAGE);
		expect(deleteOrHiddenResult.error?.issues[0].message).toBe(WRONG_COMMENT_ID_MESSAGE);
	});
});

describe("comment 체크", () => {
	it("삭제와 숨김은 comment가 없어도 통과해야 한다", () => {
		const result = deleteOrHiddenCommentForm.safeParse({
			uuid: TEST_UUID,
			commentId: TEST_COMMENT_ID,
		});

		expect(result.success).toBe(true);
	});
});
