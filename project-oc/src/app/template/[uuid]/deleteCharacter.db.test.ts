import {afterAll, afterEach, beforeAll, describe, expect, it, vi} from "vitest";
import {v7 as uuidv7} from "uuid";
import db from "@/prisma/client";
import {uuidToBin} from "@/prisma/uuid";
import {charImageBucket, charImageKey, PUBLIC_MODE_PRIVATE, PUBLIC_MODE_PUBLIC} from "@/app/create/r2";
import {deleteCharacter} from "./deleteCharacter";
import {characterTag} from "./getCharacter";
import {DELETE_CHARACTER_MESSAGE} from "./deleteCharacterMessage";

/* 행이 실제로 지워지는지와 CASCADE는 실제 DB로만 확인할 수 있어 DB는 그대로 쓰고, 바깥으로 나가는 것만 바꾼다.

   - auth: 테스트마다 로그인 상태를 바꿔 끼운다(comment.db.test.ts와 같은 방식).
   - updateTag: 서버 액션 밖에서 부르면 예외를 던진다. 호출 인자만 확인한다.
   - charImageBucket: 실제 함수는 R2 버킷 환경 변수를 읽는데 CI에는 그 값이 없다. 그대로 두면
     로컬에서만 통과하고 CI에서는 DB 삭제 뒤에 예외가 난다. 공개 여부로 이름만 갈라 돌려준다.
   - removeCharImage: 실제 R2에 요청을 보내지 않는다. 실제 함수는 실패를 안에서 삼키므로 기본값은 정상 종료다. */
const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	updateTag: vi.fn(),
	charImageBucket: vi.fn((publicMode: number): string => (publicMode === 0 ? "test-public-bucket" : "test-private-bucket")),
	removeCharImage: vi.fn(async (): Promise<void> => {}),
}));

vi.mock("@/auth/auth", () => ({auth: mocks.auth}));

/* getCharacter.ts가 같은 모듈의 unstable_cache를 쓰므로 원본을 살리고 updateTag만 바꾼다. */
vi.mock("next/cache", async (importOriginal) => ({
	...(await importOriginal<typeof import("next/cache")>()),
	updateTag: mocks.updateTag,
}));

/* PUBLIC_MODE_* 상수와 charImageKey는 원본을 쓴다. 키 조립이 바뀌면 테스트도 같이 따라가야 해서다. */
vi.mock("@/app/create/r2", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/app/create/r2")>()),
	charImageBucket: mocks.charImageBucket,
	removeCharImage: mocks.removeCharImage,
}));

/* 지우는 테스트는 캐릭터를 소모하므로 지울 캐릭터는 테스트마다 createCharacter로 만든다.
   fixture에는 사용자와 공개(keep), 비공개(private) 캐릭터를 하나씩 둔다. 지운 테스트는 끝에서 다시 만들어 둔다.
   owner는 제작자, other는 남의 프로필을 지워 보고 좋아요와 코멘트를 남기는 쪽이다. */
const fixture = {
	ownerId: "",
	otherId: "",
	keepUuid: uuidv7(),
	keepCharId: BigInt(0),
	keepImageName: "public-test-0000000000000000000000.webp",
	privateUuid: uuidv7(),
	privateCharId: BigInt(0),
	privateImageName: "privat-test-0000000000000000000000.webp",
	fakeUuid: uuidv7(),
};

/** auth()가 돌려줄 로그인 상태를 바꾼다. null이면 로그아웃. */
function loginAs(userId: string | null): void {
	mocks.auth.mockResolvedValue(userId === null ? null : {user: {id: userId}});
}

/** 제작자(기본값 owner)의 캐릭터를 하나 넣고 액션에 넘길 uuid와 행 id를 돌려준다. */
async function createCharacter(publicMode: number, charImage: string, uploaderId: string = fixture.ownerId, uuid: string = uuidv7()): Promise<{uuid: string; charId: bigint}> {
	const character = await db.character.create({
		data: {
			charName: "삭제테스트",
			/* R2에는 올리지 않는다. 컬럼 길이(41)만 맞춘다. */
			charImage,
			charProfileLayout: "h",
			charImageFrame: "square",
			charMessage: "삭제 테스트",
			charPublicMode: publicMode,
			aiUsed: 0,
			charPublicLink: uuidToBin(uuid),
			charUploaderId: uploaderId,
		},
		select: {charId: true},
	});

	return {uuid, charId: character.charId};
}

/** CASCADE 확인용 좋아요 행. */
async function createLike(charId: bigint, userId: string): Promise<void> {
	await db.characterLike.create({data: {charId, userId}});
}

/** CASCADE 확인용 코멘트 행. 지운 코멘트(deletedAt)도 같이 사라지는지 볼 수 있게 옵션으로 받는다. */
async function createComment(charId: bigint, userId: string, deletedAt: Date | null = null): Promise<bigint> {
	const comment = await db.characterComment.create({
		data: {charId, userId, charComment: "삭제 테스트 코멘트", deletedAt},
		select: {commentId: true},
	});

	return comment.commentId;
}

beforeAll(async () => {
	const [owner, other] = await Promise.all([
		db.user.create({data: {name: "delete-test-owner", username: "delete-test-owner"}}),
		db.user.create({data: {name: "delete-test-other", username: "delete-test-other"}}),
	]);

	fixture.ownerId = owner.id;
	fixture.otherId = other.id;
	fixture.privateUuid = uuidv7();

	fixture.keepCharId = (await createCharacter(PUBLIC_MODE_PUBLIC, fixture.keepImageName, fixture.ownerId, fixture.keepUuid)).charId;
	fixture.privateCharId = (await createCharacter(PUBLIC_MODE_PRIVATE, fixture.privateImageName, fixture.ownerId, fixture.privateUuid)).charId;
});

/* 테스트가 만든 캐릭터는 지우고 keep과 private만 남긴다. 좋아요와 코멘트는 Character에 Cascade라 같이 지워진다.
   두 캐릭터에 붙인 좋아요와 코멘트는 테스트마다 비운다. */
afterEach(async () => {
	await db.character.deleteMany({where: {charUploaderId: {in: [fixture.ownerId, fixture.otherId]}, charId: {notIn: [fixture.keepCharId, fixture.privateCharId]}}});
	await db.characterLike.deleteMany({where: {charId: {in: [fixture.keepCharId, fixture.privateCharId]}}});
	await db.characterComment.deleteMany({where: {charId: {in: [fixture.keepCharId, fixture.privateCharId]}}});

	mocks.auth.mockReset();
	mocks.updateTag.mockClear();
	mocks.charImageBucket.mockClear();
	mocks.removeCharImage.mockClear();
});

afterAll(async () => {
	/* Character → User는 Cascade가 없어 캐릭터부터 지운다. */
	await db.character.deleteMany({where: {charUploaderId: {in: [fixture.ownerId, fixture.otherId]}}});
	await db.user.deleteMany({where: {id: {in: [fixture.ownerId, fixture.otherId]}}});
	await db.$disconnect();
});

describe("잘못된 uuid", () => {
	it.each([["not-a-string"], 103, null, undefined] as const)("문자열이 아닌 uuid는 거부되어야 한다", async (value) => {
		loginAs(fixture.ownerId);

		const result = await deleteCharacter(value);

		expect(result).toStrictEqual({
			success: false,
			message: DELETE_CHARACTER_MESSAGE.invalidUuid,
		});
	});

	it("대시(-)가 없는 uuid는 거부되어야 한다", async () => {
		loginAs(fixture.ownerId);

		const result = await deleteCharacter(fixture.keepUuid.replaceAll("-", ""));

		expect(result).toStrictEqual({
			success: false,
			message: DELETE_CHARACTER_MESSAGE.invalidUuid,
		});
	});

	it.each([
		{value: () => fixture.keepUuid.toUpperCase(), label: "대문자 uuid는"},
		{
			value: () =>
				fixture.keepUuid
					.split("-")
					.map((value, index) => (index % 2 === 0 ? value.toUpperCase() : value))
					.join("-"),
			label: "대문자가 섞인 uuid는",
		},
	] as const)("$label 거부되어야 한다", async ({value}) => {
		loginAs(fixture.ownerId);

		const result = await deleteCharacter(value());

		expect(result).toStrictEqual({
			success: false,
			message: DELETE_CHARACTER_MESSAGE.invalidUuid,
		});
	});
});

describe("권한 없음 및 존재하지 않는 프로필", () => {
	it("비로그인 사용자는 삭제 요청을 할 시 거부되어야 한다", async () => {
		loginAs(null);

		const result = await deleteCharacter(fixture.keepUuid);

		expect(result).toStrictEqual({
			success: false,
			message: DELETE_CHARACTER_MESSAGE.notLoggedIn,
		});
	});

	it("존재하지 않는 프로필의 uuid는 거부되어야 한다", async () => {
		loginAs(fixture.ownerId);

		const result = await deleteCharacter(fixture.fakeUuid);

		expect(result).toStrictEqual({
			success: false,
			message: DELETE_CHARACTER_MESSAGE.notFound,
		});
	});

	it("프로필 제작자가 아닌 사용자가 삭제 요청을 하면 거부되어야 한다", async () => {
		loginAs(fixture.otherId);

		const deleteResult = await deleteCharacter(fixture.keepUuid);

		const existResult = await db.character.count({
			where: {
				charId: fixture.keepCharId,
			},
		});

		expect(deleteResult).toStrictEqual({
			success: false,
			message: DELETE_CHARACTER_MESSAGE.notOwner,
		});
		expect(existResult).toBeGreaterThan(0);

		expect(mocks.removeCharImage).not.toHaveBeenCalled();
		expect(mocks.updateTag).not.toHaveBeenCalled();
	});
});

describe("삭제 성공", () => {
	it("삭제하면 해당 프로필의 좋아요, 코멘트도 DB에서 삭제되어야 한다", async () => {
		const targetCharId: bigint = fixture.keepCharId;
		const targetUuid: string = fixture.keepUuid;
		const otherUserId: string = fixture.otherId;

		loginAs(otherUserId);

		await createLike(targetCharId, otherUserId);
		await createComment(targetCharId, otherUserId);
		await createComment(targetCharId, otherUserId, new Date());

		const {privateCharId} = fixture;

		await createLike(privateCharId, otherUserId);
		await createComment(privateCharId, otherUserId);
		await createComment(privateCharId, otherUserId, new Date());

		const ownerUserId: string = fixture.ownerId;

		loginAs(ownerUserId);

		const deleteResult = await deleteCharacter(targetUuid);

		expect(deleteResult.success).toBe(true);

		const firstLikeResult = await db.characterLike.count({
			where: {
				charId: targetCharId,
			},
		});
		const firstCommentResult = await db.characterComment.count({
			where: {
				charId: targetCharId,
			},
		});

		expect([firstLikeResult, firstCommentResult]).toStrictEqual([0, 0]);

		const secondLikeResult = await db.characterLike.count({
			where: {
				charId: privateCharId,
			},
		});
		const secondCommentResult = await db.characterComment.count({
			where: {
				charId: privateCharId,
			},
		});

		expect(secondLikeResult).toBeGreaterThan(0);
		expect(secondCommentResult).toBeGreaterThan(0);

		fixture.keepCharId = (await createCharacter(PUBLIC_MODE_PUBLIC, fixture.keepImageName, fixture.ownerId, fixture.keepUuid)).charId;
	});

	it.each([
		{uuid: () => fixture.keepUuid, publicMode: PUBLIC_MODE_PUBLIC, imageName: fixture.keepImageName, fixtureCharIdKey: "keepCharId", label: "공개"},
		{uuid: () => fixture.privateUuid, publicMode: PUBLIC_MODE_PRIVATE, imageName: fixture.privateImageName, fixtureCharIdKey: "privateCharId", label: "비공개"},
	] as const)("$label 프로필이 삭제되면 removeCharImage 호출 시 $label R2 버킷에 있는 이미지가 올바른 키로 삭제되어야 한다", async ({uuid, publicMode, imageName, fixtureCharIdKey}) => {
		const userId: string = fixture.ownerId;

		loginAs(userId);

		const result = await deleteCharacter(uuid());

		expect(result.success).toBe(true);

		const bucketName: string = charImageBucket(publicMode);
		const imageKey: string = charImageKey(userId, imageName);

		expect(mocks.removeCharImage).toHaveBeenCalledWith(bucketName, imageKey, expect.anything());
		expect(mocks.updateTag).toHaveBeenCalledWith(characterTag(uuid()));

		fixture[fixtureCharIdKey] = (await createCharacter(publicMode, imageName, fixture.ownerId, uuid())).charId;
	});
});

describe("이미 지워진 프로필", () => {
	it("같은 프로필을 두 번 지우면 두 번째 요청이 실패해야 한다", async () => {
		const imageName: string = fixture.keepImageName;
		const userId: string = fixture.ownerId;
		const uuid: string = fixture.keepUuid;

		loginAs(userId);

		const firstResult = await deleteCharacter(uuid);

		expect(firstResult.success).toBe(true);

		const secondResult = await deleteCharacter(uuid);

		expect(secondResult).toStrictEqual({
			success: false,
			message: DELETE_CHARACTER_MESSAGE.notFound,
		});

		fixture.keepCharId = (await createCharacter(PUBLIC_MODE_PUBLIC, imageName, userId, uuid)).charId;
	});

	it("두 요청을 동시에 하면 하나는 성공하고 나머지는 실패해야 한다", async () => {
		const imageName: string = fixture.keepImageName;
		const userId: string = fixture.ownerId;
		const uuid: string = fixture.keepUuid;

		loginAs(userId);

		const result = await Promise.all([deleteCharacter(uuid), deleteCharacter(uuid)]);

		const booleanToNumber = (value: boolean): number => {
			return value ? 1 : 0;
		};

		result.sort((a, b) => booleanToNumber(b.success) - booleanToNumber(a.success));

		const [successResult, failureResult] = result;

		expect(successResult.success).toBe(true);
		expect(failureResult).toStrictEqual({
			success: false,
			message: expect.toBeOneOf([DELETE_CHARACTER_MESSAGE.alreadyDeleted, DELETE_CHARACTER_MESSAGE.notFound]),
		});

		expect(mocks.removeCharImage).toHaveBeenCalledOnce();
		expect(mocks.updateTag).toHaveBeenCalledOnce();

		fixture.keepCharId = (await createCharacter(PUBLIC_MODE_PUBLIC, imageName, userId, uuid)).charId;
	});
});

describe("R2 이미지 삭제 실패", () => {
	it("removeCharImage가 실패해도 success를 true로 반환해야 하고, updateTag가 호출되어야 한다", async () => {
		mocks.removeCharImage.mockRejectedValueOnce(new Error("이미지 삭제 실패"));

		const userId: string = fixture.ownerId;
		const uuid: string = fixture.keepUuid;

		loginAs(userId);

		const result = await deleteCharacter(uuid);

		expect(result.success).toBe(true);
		expect(mocks.updateTag).toHaveBeenCalledOnce();

		fixture.keepCharId = (await createCharacter(PUBLIC_MODE_PUBLIC, fixture.keepImageName, userId, uuid)).charId;
	});
});
