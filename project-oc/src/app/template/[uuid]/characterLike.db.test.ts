import {afterAll, afterEach, beforeAll, describe, expect, it, vi} from "vitest";
import {v7 as uuidv7} from "uuid";
import db from "@/prisma/client";
import {uuidToBin} from "@/prisma/uuid";
import {PUBLIC_MODE_PRIVATE, PUBLIC_MODE_PUBLIC} from "@/app/create/r2";
import {getCharacterLike, setCharacterLike} from "./characterLike";

/* 좋아요의 중복 방지는 PK가, 동시 요청의 결과는 실제로 들어간 행이 정한다. mock으로는 둘 다
   증명할 수 없어 실제 DB를 탄다. 로그인 상태만 auth를 바꿔 끼운다(promptAction.test.ts와 같은 방식). */
const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
}));

vi.mock("@/auth/auth", () => ({auth: mocks.auth}));

/* 파일 전체가 같이 쓰는 행. 제작자 한 명이 공개·비공개 캐릭터를 하나씩 갖고, 좋아요를 누르는
   쪽은 다른 회원 둘이다(개수가 다른 사람 것까지 합쳐지는지 보려면 둘이 필요하다).
   테스트 DB에는 미리 심어 둔 행이 없어서 여기서 만들고 끝나면 지운다. */
const fixture = {
	ownerId: "",
	viewerId: "",
	otherViewerId: "",
	publicUuid: uuidv7(),
	privateUuid: uuidv7(),
	notFoundUuid: uuidv7(),
	publicCharId: BigInt(0),
	privateCharId: BigInt(0),
};

/** auth()가 돌려줄 로그인 상태를 바꾼다. null이면 로그아웃. */
function loginAs(userId: string | null): void {
	mocks.auth.mockResolvedValue(userId === null ? null : {user: {id: userId}});
}

async function createCharacter(uuid: string, publicMode: number): Promise<bigint> {
	const character = await db.character.create({
		data: {
			charName: "좋아요테스트",
			/* 이미지는 읽지 않는다. 컬럼 길이(41)만 맞춘다. */
			charImage: "like-test-00000000000000000000000000.webp",
			charProfileLayout: "h",
			charImageFrame: "square",
			charMessage: "좋아요 테스트",
			charPublicMode: publicMode,
			aiUsed: 0,
			charPublicLink: uuidToBin(uuid),
			charUploaderId: fixture.ownerId,
		},
		select: {charId: true},
	});

	return character.charId;
}

beforeAll(async () => {
	/* 프로필 제작자 본인과 방문자, 또 다른 방문자를 user 테이블에 insert 한다. loginAs로 Auth.js의 JWT를 교체하기 위해 fixture에 각 사용자의 id를 할당한다 */
	const [owner, viewer, otherViewer] = await Promise.all([
		db.user.create({data: {name: "like-test-owner"}}),
		db.user.create({data: {name: "like-test-viewer"}}),
		db.user.create({data: {name: "like-test-other-viewer"}}),
	]);

	fixture.ownerId = owner.id;
	fixture.viewerId = viewer.id;
	fixture.otherViewerId = otherViewer.id;

	/* 공개 프로필과 비공개 프로필을 생성한다. 비공개 프로필을 만든 이유는, 프로필 공개 여부를 변경 후, 좋아요 요청에 관한 테스트와 공개 여부에 따라 getCharacterLike 반환 여부가 달라지기 때문이다. */
	fixture.publicCharId = await createCharacter(fixture.publicUuid, PUBLIC_MODE_PUBLIC);
	fixture.privateCharId = await createCharacter(fixture.privateUuid, PUBLIC_MODE_PRIVATE);
});

/* 테스트마다 좋아요를 비운다. 앞 테스트가 남긴 행이 토글 방향을 바꾸지 않게. */
afterEach(async () => {
	await db.characterLike.deleteMany({where: {charId: {in: [fixture.publicCharId, fixture.privateCharId]}}});
	mocks.auth.mockReset();
});

afterAll(async () => {
	/* 좋아요는 Character에 Cascade라 같이 지워진다. Character → User는 Cascade가 없어 캐릭터부터 지운다. */
	await db.character.deleteMany({where: {charId: {in: [fixture.publicCharId, fixture.privateCharId]}}});
	await db.user.deleteMany({where: {id: {in: [fixture.ownerId, fixture.viewerId, fixture.otherViewerId]}}});
	await db.$disconnect();
});

describe("입력 검사", () => {
	it.each([
		{value: "123", label: "문자열"},
		{value: ["0198f2a4-7c3e-7b21-9d4a-5e6f7a8b9c0d"], label: "유사 문자열 배열"},
	] as const)("UUID가 아닌 $label을 넣으면 거부되고 reason이 'not-a-uuid'여야 한다", async ({value}) => {
		loginAs(null);

		const result = await setCharacterLike(value as unknown as string);

		expect(result).toStrictEqual({success: false, reason: "not-a-uuid"});
	});
});

describe("권한", () => {
	it("로그인하지 않고 요청하면 거부되고 reason이 'not-logged-in'이어야 한다", async () => {
		loginAs(null);

		const result = await setCharacterLike(fixture.publicUuid);

		expect(result).toStrictEqual({success: false, reason: "not-logged-in"});
	});

	it.each([
		{value: fixture.notFoundUuid, label: "없는 UUID"},
		{value: fixture.privateUuid, label: "비공개 프로필"},
	] as const)("$label에 요청하면 거부되고 reason이 'character-not-found'여야 한다", async ({value}) => {
		loginAs(fixture.viewerId);

		const result = await setCharacterLike(value);

		expect(result).toStrictEqual({success: false, reason: "character-not-found"});
	});

	it("제작자 본인이 요청하면 거부되고 reason이 'attempt-self-like'여야 한다", async () => {
		loginAs(fixture.ownerId);

		const result = await setCharacterLike(fixture.publicUuid);

		expect(result).toStrictEqual({success: false, reason: "attempt-self-like"});
	});
});

describe("토글", () => {
	it("좋아요를 처음 요청하면 result가 'insert', count가 1로 오르고, 두 번째는 result가 'delete', count가 0이 되어야 한다", async () => {
		loginAs(fixture.viewerId);

		const targetUuid: string = fixture.publicUuid;

		const firstResult = await setCharacterLike(targetUuid);

		expect(firstResult).toStrictEqual({success: true, count: 1, result: "insert"});

		const secondResult = await setCharacterLike(targetUuid);

		expect(secondResult).toStrictEqual({success: true, count: 0, result: "delete"});
	});
});

describe("동시 요청", () => {
	it("같은 사람이 동시에 두 번 눌러도 두 요청 모두 성공하고, 좋아요 행은 1개를 넘지 않아야 한다", async () => {
		loginAs(fixture.viewerId);

		const targetUuid: string = fixture.publicUuid;
		const targetCharId: bigint = fixture.publicCharId;

		const [firstResult, secondResult] = await Promise.all([setCharacterLike(targetUuid), setCharacterLike(targetUuid)]);

		const rowsResult = await db.characterLike.count({
			where: {
				charId: targetCharId,
			},
		});

		expect([firstResult.success, secondResult.success], "두 요청 모두 success가 true여야 한다").toStrictEqual([true, true]);
		expect(rowsResult, "PK가 있어 같은 사람의 좋아요 행은 1개 이하여야 한다").toBeLessThanOrEqual(1);

		/* 두 작업 중 나중에 끝난 응답의 count는 rowsResult와 같다. 순서는 모르니 "둘 중 하나는 같다"로 본다. */
		expect([firstResult.success ? firstResult.count : -1, secondResult.success ? secondResult.count : -1]).toContain(rowsResult);
	});
});

describe("getCharacterLike", () => {
	it.each([
		{value: "123", label: "문자열"},
		{value: ["0198f2a4-7c3e-7b21-9d4a-5e6f7a8b9c0d"], label: "유사 문자열 배열"},
	] as const)("UUID가 아닌 $label을 넣으면 null을 반환해야 한다", async ({value}) => {
		loginAs(null);

		const result = await getCharacterLike(value as unknown as string);

		expect(result).toBeNull();
	});

	it.each([
		{getValue: () => null, label: "로그아웃이고"},
		{getValue: () => fixture.viewerId, label: "방문자이고"},
		{getValue: () => fixture.ownerId, label: "프로필 제작자여도"},
	] as const)("$label 비공개 프로필을 조회하면 null을 반환해야 한다", async ({getValue}) => {
		loginAs(getValue());

		const result = await getCharacterLike(fixture.privateUuid);

		expect(result).toBeNull();
	});

	it.each([
		{getValue: () => null, label: "로그아웃이고", result: {count: 0, liked: false, isOwner: false}, resultText: "liked는 false, isOwner가 false"},
		{getValue: () => fixture.viewerId, label: "방문자이고", result: {count: 0, liked: false, isOwner: false}, resultText: "liked는 false, isOwner가 false"},
		{getValue: () => fixture.ownerId, label: "프로필 제작자면", result: {count: 0, liked: false, isOwner: true}, resultText: "liked는 false, isOwner가 true"},
	] as const)("$label 공개 프로필을 조회하면 $resultText여야 한다", async ({getValue, result}) => {
		loginAs(getValue());

		const getResult = await getCharacterLike(fixture.publicUuid);

		expect(getResult).toStrictEqual(result);
	});

	it("여러 방문자의 좋아요가 개수에 합쳐져야 한다", async () => {
		const targetUuid: string = fixture.publicUuid;

		loginAs(fixture.viewerId);

		await setCharacterLike(targetUuid);

		loginAs(fixture.otherViewerId);

		await setCharacterLike(targetUuid);

		const firstResult = await getCharacterLike(targetUuid);

		expect(firstResult?.count, "두 방문자가 눌렀으니 count가 2여야 한다").toBe(2);

		await setCharacterLike(targetUuid);

		const secondResult = await getCharacterLike(targetUuid);

		expect(secondResult?.count, "한 명이 취소했으니 count가 1이어야 한다").toBe(1);
	});

	it("누르거나 취소하면 그 방문자의 liked 값이 바뀌어야 한다", async () => {
		loginAs(fixture.viewerId);

		const targetUuid: string = fixture.publicUuid;

		await setCharacterLike(targetUuid);

		const firstResult = await getCharacterLike(targetUuid);

		expect(firstResult?.liked, "눌렀으니 liked가 true여야 한다").toBe(true);

		await setCharacterLike(targetUuid);

		const secondResult = await getCharacterLike(targetUuid);

		expect(secondResult?.liked, "취소했으니 liked가 false여야 한다").toBe(false);

		loginAs(fixture.otherViewerId);

		const thirdResult = await getCharacterLike(targetUuid);

		expect(thirdResult?.liked, "다른 방문자에게는 liked가 false여야 한다").toBe(false);
	});
});
