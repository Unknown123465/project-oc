import {afterAll, beforeAll, describe, expect, it, vi} from "vitest";
import {v7 as uuidv7} from "uuid";
import db from "@/prisma/client";
import {uuidToBin} from "@/prisma/uuid";
import {PUBLIC_MODE_PRIVATE, PUBLIC_MODE_PUBLIC} from "@/app/create/r2";
import {getBrowseCharacters, getCharactersAsMyList} from "./getCharacter";

/* LIKE의 %, _ 처리와 공개 여부 조건은 실제 DB로만 확인할 수 있어 DB는 그대로 쓴다.

   - auth: /mylist 검색(getCharactersAsMyList)은 로그인한 사용자의 프로필만 본다. 로그인 상태를 바꿔 끼운다.
   - charImageURL: 실제 함수는 R2 환경 변수(공개 주소, 비공개 버킷)를 읽는데 CI에는 그 값이 없다. 이미지 주소는 이 테스트의 대상이 아니라 고정 값을 돌려준다.

   테스트 DB에 다른 파일이 남긴 공개 프로필이 있어도 흔들리지 않게, 검색 결과는 이 파일이 만든 uuid만 골라서 비교한다.
   이름에 넣은 TOKEN은 다른 테스트의 프로필 이름과 겹치지 않는 글자다. */
const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	charImageURL: vi.fn(async (): Promise<string> => "https://test-image.example/char.webp"),
}));

vi.mock("@/auth/auth", () => ({auth: mocks.auth}));

vi.mock("@/app/template/[uuid]/r2", () => ({charImageURL: mocks.charImageURL}));

const TOKEN = "둘러보기검사" as const;
const PUBLIC_MODE_LINK = 1 as const;

const fixture = {
	ownerId: "",
	/** 좋아요순 확인용. 좋아요는 사용자마다 한 번이라 둘을 둔다. */
	likerIds: [] as string[],
	/** 만든 순서대로. 최신순이면 뒤에 만든 것이 먼저 나와야 한다. */
	publicPlain: uuidv7(),
	publicPercent: uuidv7(),
	publicUnderscore: uuidv7(),
	link: uuidv7(),
	private: uuidv7(),
};

const fixtureUuids = (): string[] => [fixture.publicPlain, fixture.publicPercent, fixture.publicUnderscore, fixture.link, fixture.private];

async function createCharacter(uuid: string, charName: string, publicMode: number): Promise<bigint> {
	const character = await db.character.create({
		data: {
			charName,
			/* R2에는 올리지 않는다. 컬럼 길이(41)만 맞춘다. */
			charImage: "browse-test-00000000000000000000000.webp",
			charProfileLayout: "h",
			charImageFrame: "square",
			charMessage: "둘러보기 테스트",
			charPublicMode: publicMode,
			aiUsed: 0,
			charPublicLink: uuidToBin(uuid),
			charUploaderId: fixture.ownerId,
		},
		select: {charId: true},
	});

	return character.charId;
}

/** 결과에서 이 파일이 만든 프로필만 남긴다. */
function onlyFixture(uuids: string[]): string[] {
	const mine: Set<string> = new Set(fixtureUuids());

	return uuids.filter((uuid) => mine.has(uuid));
}

async function browseUuids(keyword: string, sort: string = "latest"): Promise<string[]> {
	const result = await getBrowseCharacters({page: "1", keyword, sort});

	if (!result.success) {
		throw new Error(`redirect가 나왔다: ${result.redirectQuery}`);
	}

	return onlyFixture(result.result.characters.map(({uuid}) => uuid));
}

beforeAll(async () => {
	const [owner, likerA, likerB] = await Promise.all([
		db.user.create({data: {name: "browse-test-owner", username: "browse-test-owner"}}),
		db.user.create({data: {name: "browse-test-liker-a", username: "browse-test-liker-a"}}),
		db.user.create({data: {name: "browse-test-liker-b", username: "browse-test-liker-b"}}),
	]);

	fixture.ownerId = owner.id;
	fixture.likerIds = [likerA.id, likerB.id];

	/* createdAt이 초 단위라 같은 초에 들어갈 수 있다. 그때는 charId(만든 순서)로 정렬되므로 순서는 그대로다. */
	const plainId: bigint = await createCharacter(fixture.publicPlain, `${TOKEN}`, PUBLIC_MODE_PUBLIC);
	const percentId: bigint = await createCharacter(fixture.publicPercent, `${TOKEN}%`, PUBLIC_MODE_PUBLIC);
	await createCharacter(fixture.publicUnderscore, `${TOKEN}_`, PUBLIC_MODE_PUBLIC);
	await createCharacter(fixture.link, `${TOKEN}%_`, PUBLIC_MODE_LINK);
	await createCharacter(fixture.private, `${TOKEN}%_`, PUBLIC_MODE_PRIVATE);

	/* 좋아요: 가장 먼저 만든 plain 2개, percent 1개, underscore 0개. 좋아요순이면 최신순과 순서가 뒤집힌다. */
	await db.characterLike.createMany({
		data: [
			{charId: plainId, userId: likerA.id},
			{charId: plainId, userId: likerB.id},
			{charId: percentId, userId: likerA.id},
		],
	});
});

afterAll(async () => {
	/* 좋아요와 코멘트는 없지만 Character에 Cascade라 남아도 같이 지워진다. */
	await db.character.deleteMany({where: {charUploaderId: fixture.ownerId}});
	await db.user.deleteMany({where: {id: {in: [fixture.ownerId, ...fixture.likerIds]}}});
});

describe("getBrowseCharacters", () => {
	it("공개 프로필만 최신순으로 나와야 하고, 일부 공개와 비공개는 나오지 말아야 한다", async () => {
		expect(await browseUuids(TOKEN)).toEqual([fixture.publicUnderscore, fixture.publicPercent, fixture.publicPlain]);
	});

	it("좋아요순이면 좋아요가 많은 공개 프로필부터 나와야 한다", async () => {
		expect(await browseUuids(TOKEN, "like")).toEqual([fixture.publicPlain, fixture.publicPercent, fixture.publicUnderscore]);
	});

	it("%로 검색하면 이름에 %가 든 공개 프로필만 나와야 한다", async () => {
		expect(await browseUuids("%")).toEqual([fixture.publicPercent]);
	});

	it("_로 검색하면 이름에 _가 든 공개 프로필만 나와야 한다", async () => {
		expect(await browseUuids("_")).toEqual([fixture.publicUnderscore]);
	});

	it("\\로 검색하면 \\가 든 프로필이 없으므로 아무것도 나오지 말아야 한다", async () => {
		expect(await browseUuids("\\")).toEqual([]);
	});

	it("page가 없으면 검색어는 두고 page=1로 고친 주소를 돌려줘야 한다", async () => {
		expect(await getBrowseCharacters({keyword: TOKEN})).toEqual({success: false, redirectQuery: `?keyword=${encodeURIComponent(TOKEN)}&page=1`});
	});

	it("마지막 페이지보다 큰 page면 마지막 페이지로 고친 주소를 돌려줘야 한다", async () => {
		expect(await getBrowseCharacters({page: "999", keyword: TOKEN, sort: "like"})).toEqual({success: false, redirectQuery: `?keyword=${encodeURIComponent(TOKEN)}&sort=like&page=1`});
	});

	it("둘러보기에 없는 정렬 값이면 정렬을 빼고 page=1로 고친 주소를 돌려줘야 한다", async () => {
		expect(await getBrowseCharacters({page: "2", sort: "name"})).toEqual({success: false, redirectQuery: "?page=1"});
	});

	it("검색 결과가 없어도 1페이지는 redirect하지 않고 빈 목록을 돌려줘야 한다", async () => {
		const result = await getBrowseCharacters({page: "1", keyword: `${TOKEN}없는이름`});

		expect(result.success && result.result.characters).toEqual([]);
	});
});

describe("getCharactersAsMyList 검색어 이스케이프", () => {
	/* /mylist는 공개 여부와 상관없이 내 프로필을 전부 보므로 일부 공개, 비공개도 나온다. */
	it.each([
		["%", () => [fixture.private, fixture.link, fixture.publicPercent]],
		["_", () => [fixture.private, fixture.link, fixture.publicUnderscore]],
	])("%s 로 검색하면 그 글자가 든 내 프로필만 최신순으로 나와야 한다", async (keyword, expected) => {
		mocks.auth.mockResolvedValue({user: {id: fixture.ownerId}});

		const result = await getCharactersAsMyList({page: "1", keyword, sort: "latest"});

		if (!result.success) {
			throw new Error(`실패: ${result.reason}`);
		}

		expect(onlyFixture(result.result.characters.map(({uuid}) => uuid))).toEqual(expected());
	});
});
