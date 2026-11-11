import {afterAll, afterEach, beforeAll, describe, expect, it, vi} from "vitest";
import {v4 as uuidv4, v7 as uuidv7} from "uuid";
import db from "@/prisma/client";
import {uuidToBin} from "@/prisma/uuid";
import {charImageBucket, charImageKey, charImageTempKey, PUBLIC_MODE_PRIVATE, PUBLIC_MODE_PUBLIC} from "./r2";
import {IMAGE_MAX_FILE_SIZE, IMAGE_UPLOAD_TYPE} from "./imageEditor";
import {editCharAction} from "./action";
import type {EditCharServerFormType} from "./validator";
import {CHAR_ACTION_MESSAGE} from "./charActionMessage";

/* 행이 실제로 바뀌는지는 실제 DB로만 확인할 수 있어 DB는 그대로 쓰고, 바깥으로 나가는 것만 바꾼다.

   - auth: 테스트마다 로그인 상태를 바꿔 끼운다(deleteCharacter.db.test.ts와 같은 방식).
   - updateTag: 서버 액션 밖에서 부르면 예외를 던진다. 호출 인자만 확인한다.
   - charImageBucket: 실제 함수는 R2 버킷 환경 변수를 읽는데 CI에는 그 값이 없다. 공개 여부로 이름만 갈라 돌려준다.
   - headCharImage: 기본값은 정상 업로드(PNG, 1KB). 형식이나 크기가 틀린 경우는 mockUploaded로 바꾼다.
   - copyCharImage, removeCharImage: 실제 R2에 요청을 보내지 않는다. 호출 인자로 어느 버킷의 어느 키를 건드렸는지 확인한다. */
const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	updateTag: vi.fn(),
	charImageBucket: vi.fn((publicMode: number): string => (publicMode === 0 ? "test-public-bucket" : "test-private-bucket")),
	headCharImage: vi.fn(async (): Promise<{ContentType?: string; ContentLength?: number}> => ({ContentType: "image/png", ContentLength: 1024})),
	copyCharImage: vi.fn(async (): Promise<void> => {}),
	removeCharImage: vi.fn(async (): Promise<void> => {}),
}));

vi.mock("@/auth/auth", () => ({auth: mocks.auth}));

/* getCharacter.ts가 같은 모듈의 unstable_cache를 쓰므로 원본을 살리고 updateTag만 바꾼다. */
vi.mock("next/cache", async (importOriginal) => ({
	...(await importOriginal<typeof import("next/cache")>()),
	updateTag: mocks.updateTag,
}));

/* PUBLIC_MODE_* 상수와 charImageKey, charImageTempKey는 원본을 쓴다. 키 조립이 바뀌면 테스트도 같이 따라가야 해서다. */
vi.mock("./r2", async (importOriginal) => ({
	...(await importOriginal<typeof import("./r2")>()),
	charImageBucket: mocks.charImageBucket,
	headCharImage: mocks.headCharImage,
	copyCharImage: mocks.copyCharImage,
	removeCharImage: mocks.removeCharImage,
}));

/** owner는 제작자, other는 남의 프로필을 고쳐 보는 쪽이다. id는 beforeAll에서 채운다. */
const fixture = {
	ownerId: "",
	otherId: "",
	fakeUuid: uuidv7(),
	realUuid: uuidv7(),
	/** realUuid 캐릭터의 처음 이미지 이름. 이미지 교체 테스트 뒤 되돌릴 때 쓴다. */
	realImage: "",
};

/** auth()가 돌려줄 로그인 상태를 바꾼다. null이면 로그아웃. */
function loginAs(userId: string | null): void {
	mocks.auth.mockResolvedValue(userId === null ? null : {user: {id: userId}});
}

/** 서버가 발급하는 형식(uuid + .png)의 이미지 이름. 검증기의 CHAR_IMAGE_NAME_PATTERN을 통과한다. */
function genImageName(): string {
	return `${uuidv4()}.png`;
}

/** headCharImage가 돌려줄 업로드 결과를 이번 호출 한 번만 바꾼다. */
function mockUploaded(contentType: string = IMAGE_UPLOAD_TYPE, size: number = 1024): void {
	mocks.headCharImage.mockResolvedValueOnce({ContentType: contentType, ContentLength: size});
}

/** 테스트용 사용자 둘을 만들어 fixture에 넣는다. */
async function createUsers(): Promise<void> {
	const [owner, other] = await Promise.all([
		db.user.create({data: {name: "edit-test-owner", username: "edit-test-owner"}}),
		db.user.create({data: {name: "edit-test-other", username: "edit-test-other"}}),
	]);

	fixture.ownerId = owner.id;
	fixture.otherId = other.id;
}

/** 테스트가 만든 캐릭터와 사용자를 지운다. Character → User는 Cascade가 없어 캐릭터부터 지운다. */
async function removeCharacters(): Promise<void> {
	await db.character.deleteMany({where: {charUploaderId: {in: [fixture.ownerId, fixture.otherId]}}});
}

async function removeUsers(): Promise<void> {
	await db.user.deleteMany({where: {id: {in: [fixture.ownerId, fixture.otherId]}}});
}

/** mock 호출 기록과 로그인 상태를 비운다. 기본 구현은 남긴다. */
function resetMocks(): void {
	mocks.auth.mockReset();
	mocks.updateTag.mockClear();
	mocks.charImageBucket.mockClear();
	mocks.headCharImage.mockClear();
	mocks.copyCharImage.mockClear();
	mocks.removeCharImage.mockClear();
}

interface CreateCharacterOptions {
	publicMode?: number;
	uploaderId?: string;
	charImage?: string;
	charProfileLayout?: string;
	charImageFrame?: string;
}

/** 캐릭터를 하나 넣고 액션에 넘길 uuid와 처음 넣은 이미지 이름을 돌려준다. 기본값은 owner의 공개 가로형, 정사각형 프레임. */
async function createCharacter({
	publicMode = PUBLIC_MODE_PUBLIC,
	uploaderId = fixture.ownerId,
	charImage = genImageName(),
	charProfileLayout = "h",
	charImageFrame = "square",
}: CreateCharacterOptions = {}): Promise<{uuid: string; charImage: string}> {
	const uuid: string = uuidv7();

	await db.character.create({
		data: {
			charName: "수정테스트",
			/* R2에는 올리지 않는다. 컬럼 길이(41)만 맞춘다. */
			charImage,
			charProfileLayout,
			charImageFrame,
			charMessage: "수정 테스트",
			charPublicMode: publicMode,
			aiUsed: 0,
			charPublicLink: uuidToBin(uuid),
			charUploaderId: uploaderId,
		},
	});

	return {uuid, charImage};
}

/** 수정 액션에 넘길 값. 기본값은 createCharacter의 기본값과 같은 레이아웃, 프레임, 공개 범위에 이미지 교체 없음이다. */
function genEditInput(uuid: string, overrides: Partial<EditCharServerFormType> = {}): EditCharServerFormType {
	return {
		uuid,
		charImageName: null,
		charName: "수정테스트",
		charProfileLayout: "h",
		charImageFrame: "square",
		charMessage: "수정된 소개",
		charLike: "좋아하는 것",
		charHate: "싫어하는 것",
		charPersonality: "",
		charTmi: "",
		charKind: "",
		charAge: "",
		charBirthday: "",
		charHeight: "",
		charBirthplace: "",
		charMbti: "",
		charMusic: "",
		charColor: "#d3d3d3",
		aiUsed: "0",
		publicMode: String(PUBLIC_MODE_PUBLIC) as EditCharServerFormType["publicMode"],
		...overrides,
	};
}

/** 수정 뒤 DB에 남은 행을 읽는다. */
async function readCharacter(uuid: string) {
	return await db.character.findUnique({
		where: {charPublicLink: uuidToBin(uuid)},
		select: {
			charName: true,
			charImage: true,
			charProfileLayout: true,
			charImageFrame: true,
			charMessage: true,
			charAge: true,
			charLike: true,
			charHate: true,
			charKind: true,
			charTmi: true,
			charPublicMode: true,
			aiUsed: true,
		},
	});
}

beforeAll(async () => {
	await createUsers();

	const realCharacter = await createCharacter();

	fixture.realUuid = realCharacter.uuid;
	fixture.realImage = realCharacter.charImage;
});

/* realUuid 캐릭터만 남기고 테스트가 만든 캐릭터는 지운다. realUuid는 테스트가 고쳤을 수 있어
   genEditInput() 기본값으로 되돌린다. 폼 값을 DB 값으로 바꾸는 규칙은 action.ts의 updateChar와 같다
   (빈 문자열은 null, TMI는 배열, 공개 범위와 AI 사용은 숫자). 사용자는 afterAll까지 남긴다. */
afterEach(async () => {
	const realLink = uuidToBin(fixture.realUuid);
	const defaults = genEditInput(fixture.realUuid);

	await db.character.deleteMany({
		where: {
			charUploaderId: {in: [fixture.ownerId, fixture.otherId]},
			NOT: {charPublicLink: realLink},
		},
	});

	await db.character.update({
		where: {charPublicLink: realLink},
		data: {
			charName: defaults.charName,
			charImage: fixture.realImage,
			charProfileLayout: defaults.charProfileLayout,
			charImageFrame: defaults.charImageFrame,
			charMessage: defaults.charMessage,
			charKind: defaults.charKind || null,
			charColor: defaults.charColor,
			charMusic: defaults.charMusic || null,
			charLike: defaults.charLike || null,
			charHate: defaults.charHate || null,
			charMbti: defaults.charMbti || null,
			charBirthplace: defaults.charBirthplace || null,
			charAge: defaults.charAge || null,
			charBirthday: defaults.charBirthday || null,
			charHeight: defaults.charHeight || null,
			charPersonality: defaults.charPersonality || null,
			charTmi: [],
			charPublicMode: parseInt(defaults.publicMode, 10),
			aiUsed: parseInt(defaults.aiUsed, 10),
		},
	});

	resetMocks();
});

afterAll(async () => {
	await removeCharacters();
	await removeUsers();
	await db.$disconnect();
});

describe("권한 없는 사용자가 요청하면 거부", () => {
	it("로그아웃 상태면 서버 액션이 거부되어야 한다", async () => {
		loginAs(null);

		const value = genEditInput(fixture.realUuid);

		const result = await editCharAction(value);

		expect(result).toStrictEqual({
			success: false,
			message: CHAR_ACTION_MESSAGE.notLoggedIn,
		});
	});

	it.each([
		{value: () => genEditInput(fixture.realUuid.replaceAll("-", "")), label: "대시(-)가 없는 uuid는"},
		{value: () => genEditInput(fixture.realUuid.toUpperCase()), label: "대문자로 되어 있는 uuid는"},
	] as const)("$label 거부되어야 한다", async ({value}) => {
		loginAs(fixture.ownerId);

		const result = await editCharAction(value());

		expect(result).toStrictEqual({
			success: false,
			message: CHAR_ACTION_MESSAGE.invalidUuid,
		});
	});

	it("존재하지 않는 프로필을 요청하면 거부되어야 한다", async () => {
		loginAs(fixture.ownerId);

		const value = genEditInput(fixture.fakeUuid);

		const result = await editCharAction(value);

		expect(result).toStrictEqual({
			success: false,
			message: CHAR_ACTION_MESSAGE.notFound,
		});
	});

	it("프로필 제작자가 아닌 사용자가 요청하면 거부되어야 하고, DB가 변경되지 말아야 한다", async () => {
		const uuid: string = fixture.realUuid;
		const editedName: string = "두번째로 수정된 이름";

		loginAs(fixture.otherId);

		const firstSelectResult = await readCharacter(uuid);

		expect(firstSelectResult, "존재하고 있는 캐릭터는 DB에 있어야 한다").not.toBeNull();

		const value = genEditInput(uuid, {charName: editedName});

		const editResult = await editCharAction(value);

		expect(editResult).toStrictEqual({
			success: false,
			message: CHAR_ACTION_MESSAGE.notOwner,
		});

		const secondSelectResult = await readCharacter(uuid);

		expect(secondSelectResult?.charName).toBe(firstSelectResult?.charName);
	});
});

describe("이미지 수정 없음", () => {
	it("이미지를 재첨부하지 않으면 charImage 컬럼은 그대로, updateTag()는 1번 호출, copyCharImage()와 removeCharImage()는 호출되지 말아야 한다", async () => {
		const uuid: string = fixture.realUuid;

		loginAs(fixture.ownerId);

		const firstSelectResult = await readCharacter(uuid);

		expect(firstSelectResult).not.toBeNull();

		const value = genEditInput(uuid, {charImageName: null});

		const editResult = await editCharAction(value);

		expect(editResult.success).toBe(true);

		const secondSelectResult = await readCharacter(uuid);

		expect(secondSelectResult?.charImage).toBe(firstSelectResult?.charImage);

		expect(mocks.updateTag).toHaveBeenCalledOnce();
		expect(mocks.copyCharImage).not.toHaveBeenCalled();
		expect(mocks.removeCharImage).not.toHaveBeenCalled();
	});

	it.each([
		{value: {charProfileLayout: "v"}, label: "레이아웃만"},
		{value: {charImageFrame: "circle"}, label: "프레임만"},
		{value: {charImageFrame: "circle", charProfileLayout: "v"}, label: "레이아웃과 프레임을"},
	] as const)("이미지를 재첨부하지 않고, $label 변경하려고 하면 서버 액션에서 거부되어야 한다", async ({value}) => {
		const uuid: string = fixture.realUuid;

		loginAs(fixture.ownerId);

		const realValue = genEditInput(uuid, value);

		const result = await editCharAction(realValue);

		expect(result).toStrictEqual({
			success: false,
			message: CHAR_ACTION_MESSAGE.layoutChangeWithoutImage,
		});
	});
});

describe("비어 있는 요소", () => {
	it("비어 있는 선택 요소는 null로 변경되어야 한다", async () => {
		const uuid: string = fixture.realUuid;

		loginAs(fixture.ownerId);

		const value = genEditInput(uuid, {
			charAge: "",
			charLike: " ".repeat(5),
		});

		const editResult = await editCharAction(value);

		expect(editResult.success).toBe(true);

		const selectResult = await readCharacter(uuid);

		expect(selectResult?.charAge).toBeNull();
		expect(selectResult?.charLike, "공백도 지워져서 null이 반환되어야 한다").toBeNull();
	});

	it("TMI 요소의 빈 줄은 DB에 반영되지 말아야 한다", async () => {
		const uuid: string = fixture.realUuid;
		const tmi: string = "123\n\n456";

		loginAs(fixture.ownerId);

		const value = genEditInput(uuid, {
			charTmi: tmi,
		});

		const editResult = await editCharAction(value);

		expect(editResult.success).toBe(true);

		const tmiCleanArray: string[] = tmi.split("\n").filter((tmiValue) => tmiValue.trim());

		const selectResult = await readCharacter(uuid);

		expect(selectResult?.charTmi).toStrictEqual(tmiCleanArray);
	});
});

describe("이미지 수정", () => {
	it("이미지가 수정되면 R2 최종 주소로 복사되어야 하고, charImage 컬럼이 새 값으로 바뀌고, 임시 파일과 기존 이미지는 삭제되어야 한다", async () => {
		const uuid: string = fixture.realUuid;
		const userId: string = fixture.ownerId;
		const newImageName: string = genImageName();
		const bucket: string = charImageBucket(PUBLIC_MODE_PUBLIC);
		const tempKey: string = charImageTempKey(userId, newImageName);
		const key: string = charImageKey(userId, newImageName);

		loginAs(userId);

		const value = genEditInput(uuid, {
			charImageName: newImageName,
		});

		const editResult = await editCharAction(value);

		expect(editResult.success).toBe(true);

		const selectResult = await readCharacter(uuid);

		expect(selectResult?.charImage).toBe(newImageName);

		expect(mocks.copyCharImage).toHaveBeenCalledOnce();
		expect(mocks.copyCharImage).toHaveBeenCalledWith(bucket, tempKey, key);
		expect(mocks.removeCharImage).toHaveBeenCalledTimes(2);
		expect(mocks.removeCharImage).toHaveBeenCalledWith(bucket, tempKey, expect.anything());
		expect(mocks.removeCharImage).toHaveBeenCalledWith(bucket, charImageKey(userId, fixture.realImage), expect.anything());
		expect(mocks.removeCharImage).not.toHaveBeenCalledWith(bucket, key, expect.anything());
	});

	it.each([
		{value: {charProfileLayout: "v"}, label: "레이아웃"},
		{value: {charImageFrame: "circle"}, label: "프레임"},
		{value: {charImageFrame: "circle", charProfileLayout: "v"}, label: "레이아웃과 프레임"},
	] as const)("이미지가 수정되면 $label 변경도 DB에 반영되어야 한다", async ({value}) => {
		const uuid: string = fixture.realUuid;
		const newImageName: string = genImageName();

		loginAs(fixture.ownerId);

		const realValue = genEditInput(uuid, {
			...value,
			charImageName: newImageName,
		});

		const editResult = await editCharAction(realValue);

		expect(editResult.success).toBe(true);

		const selectResult = await readCharacter(uuid);

		expect(selectResult?.charImage).toBe(newImageName);

		if ("charProfileLayout" in value) {
			expect(selectResult?.charProfileLayout).toBe(value.charProfileLayout);
		}

		if ("charImageFrame" in value) {
			expect(selectResult?.charImageFrame).toBe(value.charImageFrame);
		}
	});

	it("업로드 확인에 실패하면 서버 액션에서 거부되어야 한다", async () => {
		mocks.headCharImage.mockRejectedValueOnce(new Error(""));

		const uuid: string = fixture.realUuid;

		loginAs(fixture.ownerId);

		const value = genEditInput(uuid, {
			charImageName: genImageName(),
		});

		const result = await editCharAction(value);

		expect(result).toStrictEqual({
			success: false,
			message: CHAR_ACTION_MESSAGE.imageNotUploaded,
		});
	});

	it("이미지 형식이 틀리면 거부되어야 한다", async () => {
		mockUploaded("image/jpeg");

		const uuid: string = fixture.realUuid;

		loginAs(fixture.ownerId);

		const value = genEditInput(uuid, {
			charImageName: genImageName(),
		});

		const result = await editCharAction(value);

		expect(result).toStrictEqual({
			success: false,
			message: CHAR_ACTION_MESSAGE.imageInvalid,
		});
	});

	it(`이미지 크기가 정확히 ${IMAGE_MAX_FILE_SIZE / 1024 / 1024}MB이면 통과되어야 한다`, async () => {
		mockUploaded(IMAGE_UPLOAD_TYPE, IMAGE_MAX_FILE_SIZE);

		const uuid: string = fixture.realUuid;

		loginAs(fixture.ownerId);

		const value = genEditInput(uuid, {
			charImageName: genImageName(),
		});

		const result = await editCharAction(value);

		expect(result.success).toBe(true);
	});

	it.each([
		{value: 0, label: "0MB이면"},
		{value: IMAGE_MAX_FILE_SIZE + 1, label: "10MB를 초과하면"},
	])("이미지 크기가 $label 거부되어야 한다", async ({value}) => {
		mockUploaded(IMAGE_UPLOAD_TYPE, value);

		const uuid: string = fixture.realUuid;

		loginAs(fixture.ownerId);

		const realValue = genEditInput(uuid, {
			charImageName: genImageName(),
		});

		const result = await editCharAction(realValue);

		expect(result).toStrictEqual({
			success: false,
			message: CHAR_ACTION_MESSAGE.imageInvalid,
		});
	});

	it("이미지 복사에 실패하면 tmp에 있는 이미지와 최종 경로에 있는 이미지는 삭제되어야 하고, DB는 변경되지 않아야 하며 updateTag는 호출되지 말아야 한다", async () => {
		mocks.copyCharImage.mockRejectedValueOnce(new Error());

		const uuid: string = fixture.realUuid;

		loginAs(fixture.ownerId);

		const firstSelectResult = await readCharacter(uuid);

		expect(firstSelectResult).not.toBeNull();

		const value = genEditInput(uuid, {
			charImageName: genImageName(),
			charName: "수정된 이름",
		});

		const editResult = await editCharAction(value);

		expect(editResult).toStrictEqual({
			success: false,
			message: CHAR_ACTION_MESSAGE.editFailed,
		});

		const secondSelectResult = await readCharacter(uuid);

		expect(secondSelectResult?.charImage).toBe(firstSelectResult?.charImage);
		expect(secondSelectResult?.charName).toBe(firstSelectResult?.charName);

		expect(mocks.removeCharImage).toHaveBeenCalledTimes(2);
		expect(mocks.updateTag).not.toHaveBeenCalled();
	});
});

describe("프로필 공개 여부 변경", () => {
	it.each([
		{beforeMode: PUBLIC_MODE_PUBLIC, afterMode: PUBLIC_MODE_PRIVATE, resultBucket: charImageBucket(PUBLIC_MODE_PRIVATE), label: "공개에서 비공개로", resultLabel: "비공개"},
		{beforeMode: PUBLIC_MODE_PRIVATE, afterMode: PUBLIC_MODE_PUBLIC, resultBucket: charImageBucket(PUBLIC_MODE_PUBLIC), label: "비공개에서 공개로", resultLabel: "공개"},
	] as const)("$label 변경하면 이미지가 $resultLabel 버킷으로 이동되어야 한다", async ({beforeMode, afterMode, resultBucket}) => {
		const uuid: string = fixture.realUuid;
		const userId: string = fixture.ownerId;
		const beforeBucket: string = charImageBucket(beforeMode);

		loginAs(userId);

		const firstSelectResult = await readCharacter(uuid);

		expect(firstSelectResult).not.toBeNull();

		const key: string = charImageKey(userId, firstSelectResult?.charImage as string);

		await db.character.update({
			data: {
				charPublicMode: beforeMode,
			},
			where: {
				charPublicLink: uuidToBin(uuid),
			},
		});

		const value = genEditInput(uuid, {
			publicMode: afterMode.toString() as EditCharServerFormType["publicMode"],
		});

		const editResult = await editCharAction(value);

		expect(editResult.success).toBe(true);

		const secondSelectResult = await readCharacter(uuid);

		expect(secondSelectResult?.charPublicMode).toBe(afterMode);

		expect(mocks.copyCharImage).toHaveBeenCalledWith(resultBucket, key, key, {
			sourceBucket: charImageBucket(beforeMode),
		});
		expect(mocks.removeCharImage).toHaveBeenCalledOnce();
		expect(mocks.removeCharImage).toHaveBeenCalledWith(beforeBucket, key, expect.anything());
		expect(mocks.updateTag).toHaveBeenCalledOnce();
	});

	it.each([
		{beforeMode: 1, afterMode: 2, resultBucket: charImageBucket(PUBLIC_MODE_PRIVATE), label: "일부 공개에서 비공개로"},
		{beforeMode: 2, afterMode: 1, resultBucket: charImageBucket(PUBLIC_MODE_PRIVATE), label: "비공개에서 일부 공개로"},
	] as const)("$label 변경하면 이미지가 이동되지 말아야 하므로 이미지 복사와 삭제가 실행되지 말아야 한다", async ({beforeMode, afterMode}) => {
		const uuid: string = fixture.realUuid;
		const userId: string = fixture.ownerId;

		loginAs(userId);

		const firstSelectResult = await readCharacter(uuid);

		expect(firstSelectResult).not.toBeNull();

		await db.character.update({
			data: {
				charPublicMode: beforeMode,
			},
			where: {
				charPublicLink: uuidToBin(uuid),
			},
		});

		const value = genEditInput(uuid, {
			publicMode: afterMode.toString() as EditCharServerFormType["publicMode"],
		});

		const editResult = await editCharAction(value);

		expect(editResult.success).toBe(true);

		const secondSelectResult = await readCharacter(uuid);

		expect(secondSelectResult?.charPublicMode).toBe(afterMode);

		expect(mocks.copyCharImage).not.toHaveBeenCalled();
		expect(mocks.removeCharImage).not.toHaveBeenCalled();
	});

	it("이미지 파일 복사에 실패하면 서버 액션이 거부되어야 하고, DB는 변경되지 말아야 한다", async () => {
		mocks.copyCharImage.mockRejectedValueOnce(new Error());

		const uuid: string = fixture.realUuid;
		const userId: string = fixture.ownerId;

		loginAs(userId);

		await db.character.update({
			data: {
				charPublicMode: PUBLIC_MODE_PUBLIC,
			},
			where: {
				charPublicLink: uuidToBin(uuid),
			},
		});

		const firstSelectResult = await readCharacter(uuid);

		expect(firstSelectResult).not.toBeNull();

		const beforeCharName = firstSelectResult?.charName;
		const afterCharName: string = "수정되고만 이름";

		const value = genEditInput(uuid, {
			charName: afterCharName,
			publicMode: PUBLIC_MODE_PRIVATE.toString() as EditCharServerFormType["publicMode"],
		});

		const editResult = await editCharAction(value);

		expect(editResult).toStrictEqual({
			success: false,
			message: CHAR_ACTION_MESSAGE.editFailed,
		});

		const secondSelectResult = await readCharacter(uuid);

		expect(secondSelectResult?.charPublicMode).toBe(PUBLIC_MODE_PUBLIC);
		expect(secondSelectResult?.charName).toBe(beforeCharName);

		expect(mocks.removeCharImage).not.toHaveBeenCalled();
		expect(mocks.updateTag).not.toHaveBeenCalled();
	});
});
