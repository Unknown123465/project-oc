import {describe, expect, it} from "vitest";
import {providerForm, toLoginQuery, resolveLoginRedirect, LOGIN_QUERY_TYPE_IS_NOT_VALID, LOGIN_QUERY_UUID_IS_NOT_VALID} from "./validator";

function genQueryObject(stringParams: string): Record<string, string> | null {
	const searchParams: URLSearchParams = new URLSearchParams(stringParams);
	const queryObject = toLoginQuery(searchParams);

	return queryObject;
}

describe("공급업체", () => {
	it.each(["Google", "Naver", "Kakao", "Twitter"] as const)("목록에 있는 공급업체(%s)를 넣으면 통과해야 한다", (value) => {
		expect(providerForm.safeParse(value).success).toBe(true);
	});

	it.each(["Facebook", "Instagram", "Threads"] as const)("목록에 없는 공급업체(%s)를 넣으면 거부되어야 한다", (value) => {
		expect(providerForm.safeParse(value).success).toBe(false);
	});

	it.each(["google", "naver", "kakao", "twitter"] as const)("대소문자만 다른 값(%s)을 넣으면 거부되어야 한다", (value) => {
		expect(providerForm.safeParse(value).success).toBe(false);
	});

	it.each([undefined, null, 165] as const)("문자열이 아닌 값(%s)을 넣으면 거부되어야 한다", (value) => {
		expect(providerForm.safeParse(value).success).toBe(false);
	});

	it("빈 문자열을 넣으면 거부되어야 한다", () => {
		expect(providerForm.safeParse("").success).toBe(false);
	});
});

describe("쿼리 분기 판단", () => {
	it("쿼리가 없으면(null) 통과하고 result가 '/'여야 한다", () => {
		const queryObject = genQueryObject("");
		const result = resolveLoginRedirect(queryObject);

		expect(result).toStrictEqual({success: true, result: "/"});
	});

	it.each([
		{value: undefined, label: "undefined"},
		{value: [1, 2, 3], label: "배열"},
		{value: 123, label: "숫자"},
	] as const)("쿼리가 객체가 아니면($label) 거부되고 요청 오류 문구를 돌려줘야 한다", ({value}) => {
		const result = resolveLoginRedirect(value);

		expect(result).toStrictEqual({success: false, message: LOGIN_QUERY_TYPE_IS_NOT_VALID});
	});

	it("Auth.js가 붙인 ?error=Configuration만 있으면 통과하고 result가 '/'여야 한다", () => {
		const queryObject = genQueryObject("?error=Configuration");
		const result = resolveLoginRedirect(queryObject);

		expect(result).toStrictEqual({success: true, result: "/"});
	});

	it("link가 template이고 uuid 형식이 맞으면 통과하고 result가 그 프로필 경로여야 한다", () => {
		const link: string = "template";
		const uuid: string = "01a1669b-1ac1-7172-9ad2-6bf5ecdd15f4";

		const queryObject = genQueryObject(`?link=${link}&uuid=${uuid}`);
		const result = resolveLoginRedirect(queryObject);

		expect(result).toStrictEqual({success: true, result: `/${link}/${uuid}`});
	});

	it("link는 맞고 uuid 형식이 틀리면 거부되고 uuid 오류 문구를 돌려줘야 한다", () => {
		const link: string = "template";
		const uuid: string = "not-a-uuid";

		const queryObject = genQueryObject(`?link=${link}&uuid=${uuid}`);
		const result = resolveLoginRedirect(queryObject);

		expect(result).toStrictEqual({success: false, message: LOGIN_QUERY_UUID_IS_NOT_VALID});
	});

	it("link는 맞고 uuid에 한글이 섞여 있으면 거부되어야 한다", () => {
		const link: string = "template";
		const uuid: string = "01a161a1-daa9-7121-9811-0ㅁㅁㅁ";

		const queryObject = genQueryObject(`?link=${link}&uuid=${uuid}`);
		const result = resolveLoginRedirect(queryObject);

		expect(result).toStrictEqual({success: false, message: LOGIN_QUERY_UUID_IS_NOT_VALID});
	});

	it("link와 uuid가 둘 다 틀리면 link를 먼저 보고 result가 '/'여야 한다", () => {
		const link: string = "not-template";
		const uuid: string = "not-a-uuid";

		const queryObject = genQueryObject(`?link=${link}&uuid=${uuid}`);
		const result = resolveLoginRedirect(queryObject);

		expect(result).toStrictEqual({success: true, result: "/"});
	});

	it.each([
		{uuid: "not-a-uuid", label: "틀려도"},
		{uuid: "01a1669b-1ac1-7172-9ad2-6bf5ecdd15f4", label: "맞아도"},
	] as const)("link 없이 uuid만 있으면 uuid 형식이 $label 통과하고 result가 '/'여야 한다", ({uuid}) => {
		const queryObject = genQueryObject(`?uuid=${uuid}`);
		const result = resolveLoginRedirect(queryObject);

		expect(result).toStrictEqual({success: true, result: "/"});
	});

	it.each([
		{uuid: "01A1669B-1AC1-7172-9AD2-6BF5ECDD15F4", label: "대문자"},
		{uuid: "01A1669B-1Ac1-7172-9ad2-6bf5ecdD15F4", label: "대소문자가 섞인"},
	] as const)("$label uuid도 통과하고 result가 그 프로필 경로여야 한다", ({uuid}) => {
		const link: string = "template";

		const queryObject = genQueryObject(`?link=${link}&uuid=${uuid}`);
		const result = resolveLoginRedirect(queryObject);

		expect(result).toStrictEqual({success: true, result: `/${link}/${uuid}`});
	});

	it.each(["not-template", "create", "login", "../template", "//evil.com", "javascript:alert('you have been hacked')"] as const)(
		"허용 목록에 없는 link(%s)가 오면 통과하고 result가 '/'여야 한다",
		(link) => {
			const uuid: string = "01a1669b-1ac1-7172-9ad2-6bf5ecdd15f4";

			const queryObject = genQueryObject(`?link=${link}&uuid=${uuid}`);
			const result = resolveLoginRedirect(queryObject);

			expect(result).toStrictEqual({success: true, result: "/"});
		}
	);

	it.each([
		{uuid: "01a1669b1ac171729ad26bf5ecdd15f4", label: "하이픈 없는 32자리"},
		{uuid: "01h1669i-1jk1-7172-9v2-6bp5ecdd15f4", label: "16진수가 아닌 문자가 섞인 값"},
		{uuid: "../", label: "상위 경로"},
		{uuid: "//evil.com", label: "외부 주소"},
		{uuid: "javascript:alert('you have been hacked')", label: "스크립트 주소"},
	] as const)("link는 맞고 uuid 자리에 잘못된 값($label)이 오면 거부되어야 한다", ({uuid}) => {
		const link: string = "template";

		const queryObject = genQueryObject(`?link=${link}&uuid=${uuid}`);
		const result = resolveLoginRedirect(queryObject);

		expect(result).toStrictEqual({success: false, message: LOGIN_QUERY_UUID_IS_NOT_VALID});
	});

	/* 버전 자리는 보지 않는다. z.uuid() 대신 프로필 페이지와 같은 isUuid(src/prisma/uuid.ts)로
	   검사해서, 프로필 페이지가 여는 uuid는 여기서도 통과해야 한다. */
	it.each([
		{uuid: "04bc5230-ce8c-11f1-a76a-37da4ed8df4d", label: 1},
		{uuid: "6149a2f2-494c-49b9-814e-5e2a7db2c587", label: 4},
	] as const)("버전 자리가 다른 uuid(버전 $label)도 통과하고 result가 그 프로필 경로여야 한다", ({uuid}) => {
		const link: string = "template";

		const queryObject = genQueryObject(`?link=${link}&uuid=${uuid}`);
		const result = resolveLoginRedirect(queryObject);

		expect(result).toStrictEqual({success: true, result: `/${link}/${uuid}`});
	});

	it.each([
		{uuid: "00000000-0000-0000-0000-000000000000", label: "0"},
		{uuid: "ffffffff-ffff-ffff-ffff-ffffffffffff", label: "f"},
	] as const)("한 글자로만 채운 uuid(전부 $label)도 통과하고 result가 그 프로필 경로여야 한다", ({uuid}) => {
		const link: string = "template";

		const queryObject = genQueryObject(`?link=${link}&uuid=${uuid}`);
		const result = resolveLoginRedirect(queryObject);

		expect(result).toStrictEqual({success: true, result: `/${link}/${uuid}`});
	});
});
