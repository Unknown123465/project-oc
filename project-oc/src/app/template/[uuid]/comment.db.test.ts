import {afterAll, afterEach, beforeAll, describe, expect, it, vi} from "vitest";
import {v7 as uuidv7} from "uuid";
import db from "@/prisma/client";
import {uuidToBin} from "@/prisma/uuid";
import {PUBLIC_MODE_PRIVATE, PUBLIC_MODE_PUBLIC} from "@/app/create/r2";
import {deleteComment, editComment, getCommentsByTemplate, hideComment, writeComment} from "./comment";
import {COMMENT_MESSAGE} from "./commentMessage";
import {JudgeScore} from "./commentJudge";

interface EachFnType {
	uuid: string;
	commentId: bigint | string;
	comment: string;
}

/* 권한·비공개 차단·soft delete는 실제로 남은 행으로만 확인할 수 있어 실제 DB를 탄다.
   로그인 상태만 auth를 바꿔 끼운다(characterLike.db.test.ts와 같은 방식).

   나머지는 기본값이 "항상 통과"인 vi.fn()이다. 테스트에서 다른 결과가 필요하면
   mockResolvedValueOnce, mockReturnValueOnce로 그 호출만 바꾼다.
   BLIND_COMMENT_SCORE는 comment.ts가 import될 때 읽어서 여기서 먼저 넣는다. */
const mocks = vi.hoisted(() => {
	process.env.BLIND_COMMENT_SCORE = "75";

	return {
		auth: vi.fn(),
		claimCommentJudge: vi.fn(async (): Promise<boolean> => true),
		getCommentJudgeEnabled: vi.fn(async (): Promise<boolean> => true),
		JUDGE_COMMENT_NULL_RESULT: {
			spamScore: null,
			mockeryScore: null,
			ownerAttackScore: null,
			userAttackScore: null,
			sexualScore: null,
			goreScore: null,
		},
		judgeComment: vi.fn(async (): Promise<Record<string, number | null>> => ({
			spamScore: 0,
			mockeryScore: 0,
			ownerAttackScore: 0,
			userAttackScore: 0,
			sexualScore: 0,
			goreScore: 0,
		})),
		judgeCommentScore: vi.fn((): {isPass: boolean; isBlind: boolean; isDeny: boolean; highestScoreType: string | null; retry: boolean} => ({
			isPass: true,
			isBlind: false,
			isDeny: false,
			highestScoreType: null,
			retry: false,
		})),
		setCommentScoreIfOwner: vi.fn((score: unknown) => score),
	};
});

vi.mock("@/auth/auth", () => ({auth: mocks.auth}));

vi.mock("./commentJudgeDraft", () => ({claimCommentJudge: mocks.claimCommentJudge}));

/* 킬 스위치의 실제 값을 읽으면 Vercel에 저장된 값에 따라 결과가 달라진다. */
vi.mock("@/app/create/globalConfig", () => ({getCommentJudgeEnabled: mocks.getCommentJudgeEnabled}));

/* 실제 Jev 요청을 보내지 않는다. commentJudge.ts의 server-only도 Vitest에서 찾을 수 없어 파일째 대체한다. */
vi.mock("./commentJudge", () => ({
	JUDGE_COMMENT_NULL_RESULT: mocks.JUDGE_COMMENT_NULL_RESULT,
	judgeComment: mocks.judgeComment,
	judgeCommentScore: mocks.judgeCommentScore,
	setCommentScoreIfOwner: mocks.setCommentScoreIfOwner,
}));

/* 파일 전체가 같이 쓰는 행. 제작자 한 명이 공개·비공개 캐릭터를 하나씩 갖고, 코멘트를 쓰는
   쪽(writer)과 남의 코멘트를 건드려 보는 쪽(other)은 다른 회원이다. */
const fixture = {
	ownerId: "",
	writerId: "",
	otherId: "",
	publicUuid: uuidv7(),
	privateUuid: uuidv7(),
	notFoundUuid: uuidv7(),
	publicCharId: BigInt(0),
	privateCharId: BigInt(0),
};

const TEST_UUID = "01a194aa-c914-7530-b090-df24923178fd" as const;

/** auth()가 돌려줄 로그인 상태를 바꾼다. null이면 로그아웃. */
function loginAs(userId: string | null): void {
	mocks.auth.mockResolvedValue(userId === null ? null : {user: {id: userId}});
}

async function createCharacter(uuid: string, publicMode: number): Promise<bigint> {
	const character = await db.character.create({
		data: {
			charName: "코멘트테스트",
			/* 이미지는 읽지 않는다. 컬럼 길이(41)만 맞춘다. */
			charImage: "comment-test-000000000000000000000.webp",
			charProfileLayout: "h",
			charImageFrame: "square",
			charMessage: "코멘트 테스트",
			charPublicMode: publicMode,
			aiUsed: 0,
			charPublicLink: uuidToBin(uuid),
			charUploaderId: fixture.ownerId,
		},
		select: {charId: true},
	});

	return character.charId;
}

/** 서버 액션을 거치지 않고 코멘트 행을 바로 넣는다. 비공개 프로필처럼 액션으로는 쓸 수 없는 자리에 행을 두거나,
 *  삭제·숨김 상태를 미리 만들어 둘 때 쓴다. 돌려주는 값은 액션에 넘길 문자열 commentId다. */
async function createComment(
	charId: bigint,
	userId: string,
	options: {comment?: string; createdAt?: Date; deletedAt?: Date | null; hiddenAt?: Date | null; score?: Partial<JudgeScore<number | null>>; rejudgeCount?: number | null} = {}
): Promise<string> {
	const comment = await db.characterComment.create({
		data: {
			charId,
			userId,
			charComment: options.comment ?? "테스트 코멘트",
			createdAt: options.createdAt ?? undefined,
			deletedAt: options.deletedAt ?? null,
			hiddenAt: options.hiddenAt ?? null,
			...options.score,
			rejudgeCount: options.rejudgeCount ?? null,
		},
		select: {commentId: true},
	});

	return comment.commentId.toString();
}

/** 액션이 남긴 행을 그대로 읽는다. soft delete와 updatedAt처럼 응답에 안 나오는 값을 확인할 때 쓴다. */
async function readComment(commentId: string) {
	return await db.characterComment.findUnique({
		where: {commentId: BigInt(commentId)},
	});
}

beforeAll(async () => {
	const [owner, writer, other] = await Promise.all([
		db.user.create({data: {name: "comment-test-owner", username: "comment-test-owner"}}),
		db.user.create({data: {name: "comment-test-writer", username: "comment-test-writer"}}),
		db.user.create({data: {name: "comment-test-other", username: "comment-test-other"}}),
	]);

	fixture.ownerId = owner.id;
	fixture.writerId = writer.id;
	fixture.otherId = other.id;

	fixture.publicCharId = await createCharacter(fixture.publicUuid, PUBLIC_MODE_PUBLIC);
	fixture.privateCharId = await createCharacter(fixture.privateUuid, PUBLIC_MODE_PRIVATE);
});

/* 테스트마다 코멘트를 비운다. 앞 테스트가 남긴 행이 목록 개수나 숨김 방향을 바꾸지 않게. */
afterEach(async () => {
	await db.characterComment.deleteMany({where: {charId: {in: [fixture.publicCharId, fixture.privateCharId]}}});
	mocks.auth.mockReset();
	mocks.judgeCommentScore.mockReset();
	mocks.judgeComment.mockReset();
	mocks.claimCommentJudge.mockReset();
	mocks.getCommentJudgeEnabled.mockReset();
	mocks.setCommentScoreIfOwner.mockReset();
});

afterAll(async () => {
	/* 코멘트는 Character에 Cascade라 같이 지워진다. Character → User는 Cascade가 없어 캐릭터부터 지운다. */
	await db.character.deleteMany({where: {charId: {in: [fixture.publicCharId, fixture.privateCharId]}}});
	await db.user.deleteMany({where: {id: {in: [fixture.ownerId, fixture.writerId, fixture.otherId]}}});
	await db.$disconnect();
});

describe("공통 서버 액션", () => {
	it("비로그인 상태면 코멘트 조회 서버 액션이 거부되지 말아야 한다", async () => {
		loginAs(null);

		const uuid: string = fixture.publicUuid;
		const charId: bigint = fixture.publicCharId;

		await createComment(charId, fixture.ownerId, {
			comment: "테스트",
		});

		const result = await getCommentsByTemplate(uuid);

		expect(result).toBeInstanceOf(Array);
	});

	it.each([
		{fn: (value: EachFnType) => writeComment(value), label: "작성"},
		{fn: (value: EachFnType) => editComment(value), label: "수정"},
		{fn: (value: EachFnType) => deleteComment(value), label: "삭제"},
		{fn: (value: EachFnType) => hideComment(value), label: "숨김"},
	] as const)("비로그인 상태면 $label 서버 액션이 거부되어야 한다", async ({fn}) => {
		loginAs(null);

		const uuid: string = fixture.publicUuid;
		const charId: bigint = fixture.publicCharId;
		const comment: string = "테스트 코멘트";

		const commentId = await createComment(charId, fixture.ownerId, {
			comment: "테스트",
		});

		const value: EachFnType = {
			uuid,
			commentId: BigInt(commentId),
			comment,
		};

		const result = await fn(value);

		expect(result).toStrictEqual({
			success: false,
			message: COMMENT_MESSAGE.notLoggedIn,
		});
		expect(mocks.judgeComment).not.toHaveBeenCalled();
	});

	it("없는 프로필의 코멘트를 조회하면 null을 반환해야 한다", async () => {
		loginAs(null);

		const logoutResult = await getCommentsByTemplate(TEST_UUID);

		expect(logoutResult, "비로그인 상태면 null을 반환해야 한다").toBeNull();

		loginAs(fixture.ownerId);

		const loginResult = await getCommentsByTemplate(TEST_UUID);

		expect(loginResult, "로그인 상태여도 null을 반환해야 한다").toBeNull();
	});

	it.each([
		{fn: (value: EachFnType) => writeComment(value), label: "작성", message: COMMENT_MESSAGE.profileNotFound},
		{fn: (value: EachFnType) => editComment(value), label: "수정", message: COMMENT_MESSAGE.notFound},
		{fn: (value: EachFnType) => deleteComment(value), label: "삭제", message: COMMENT_MESSAGE.notFound},
		{fn: (value: EachFnType) => hideComment(value), label: "숨김", message: COMMENT_MESSAGE.notFound},
	] as const)("없는 프로필에 요청하면 $label 서버 액션이 거부되어야 한다", async ({fn, message}) => {
		loginAs(fixture.ownerId);

		const value: EachFnType = {
			uuid: TEST_UUID,
			commentId: "1",
			comment: "테스트 코멘트",
		};

		const result = await fn(value);

		expect(result).toStrictEqual({
			success: false,
			message,
		});
		expect(mocks.judgeComment).not.toHaveBeenCalled();
	});

	it.each([
		{fn: (value: EachFnType) => writeComment(value), label: "작성", message: COMMENT_MESSAGE.writePrivate},
		{fn: (value: EachFnType) => editComment(value), label: "수정", message: COMMENT_MESSAGE.editPrivate},
		{fn: (value: EachFnType) => deleteComment(value), label: "삭제", message: COMMENT_MESSAGE.deletePrivate},
		{fn: (value: EachFnType) => hideComment(value), label: "숨김", message: COMMENT_MESSAGE.hidePrivate.hide},
	] as const)("비공개 프로필에 요청하면 $label 서버 액션이 거부되어야 한다", async ({fn, message}) => {
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.privateCharId;
		const uuid: string = fixture.privateUuid;
		const comment: string = "테스트 코멘트";

		loginAs(userId);

		const commentId: string = await createComment(charId, userId, {
			comment,
		});

		const value: EachFnType = {
			uuid,
			commentId,
			comment,
		};

		const result = await fn(value);

		expect(result).toStrictEqual({
			success: false,
			message,
		});
		expect(mocks.judgeComment).not.toHaveBeenCalled();
	});
});

describe("코멘트 작성", () => {
	it("코멘트를 작성하면 저장되어야 한다", async () => {
		const uuid: string = fixture.publicUuid;

		const otherId: string = fixture.otherId;

		loginAs(otherId);

		const otherComment: string = "작성 테스트 코멘트";

		await writeComment({uuid, comment: otherComment});

		const ownerId: string = fixture.ownerId;

		loginAs(ownerId);

		const ownerComment: string = "본인 작성 테스트 코멘트";

		await writeComment({uuid, comment: ownerComment});

		const result = await getCommentsByTemplate(uuid);

		expect(result?.map((list) => list.charComment)).toStrictEqual([otherComment, ownerComment]);
	});

	it.each([
		{value: "가나다", blank: " ".repeat(10), label: "일반 공백"},
		{value: "abc", blank: "\u115f\u1160\u3164", label: "특수 공백"},
		{value: "코멘트AAA", blank: "\u200d", label: "ZWJ"},
	] as const)("앞뒤에 공백($label)을 넣으면 정리된 뒤 '$value'만 남아야 한다", async ({value, blank}) => {
		const ownerId: string = fixture.ownerId;

		loginAs(ownerId);

		const uuid: string = fixture.publicUuid;
		const comment: string = blank + value + blank;

		await writeComment({uuid, comment});

		const result = await getCommentsByTemplate(uuid);

		expect(result?.map((list) => list.charComment)).toStrictEqual([value]);
	});

	it.each([
		{name: "spamScore", label: "스팸 코멘트"},
		{name: "mockeryScore", label: "과도한 프로필 조롱 및 거친 비하"},
		{name: "ownerAttackScore", label: "프로필 제작자 공격"},
		{name: "userAttackScore", label: "다른 사용자 공격"},
	] as const)("$label 판정 점수가 90 이상이면 거부 되어야 한다", async ({name, label}) => {
		mocks.judgeCommentScore.mockReturnValueOnce({
			isPass: false,
			isBlind: false,
			isDeny: true,
			highestScoreType: name,
			retry: false,
		});

		loginAs(fixture.otherId);

		const uuid: string = fixture.publicUuid;
		const charId: bigint = fixture.publicCharId;
		const comment: string = `거부된 코멘트 - ${label}`;

		const result = await writeComment({uuid, comment});

		expect(result).toStrictEqual({
			success: false,
			message: COMMENT_MESSAGE.deny[name],
		});

		const selectResult = await db.characterComment.findFirst({
			where: {
				charId,
				charComment: comment,
			},
			select: {
				commentId: true,
			},
		});

		expect(selectResult).toBeNull();
	});

	it("judgeComment가 점수를 반환하면 DB 컬럼 6개에 그대로 저장되어야 한다", async () => {
		const scoreObj = {
			spamScore: 10,
			mockeryScore: 20,
			ownerAttackScore: 30,
			userAttackScore: 40,
			sexualScore: 50,
			goreScore: 60,
		} as const;

		mocks.judgeComment.mockResolvedValueOnce(scoreObj);

		const uuid: string = fixture.publicUuid;
		const charId: bigint = fixture.publicCharId;
		const userId: string = fixture.otherId;
		const comment: string = "판정 점수 테스트용 코멘트";

		loginAs(userId);

		await writeComment({uuid, comment});

		const selectResult = await db.characterComment.findFirst({
			where: {
				charId,
				charComment: comment,
			},
		});

		const scoreResult = {
			spamScore: selectResult?.spamScore,
			mockeryScore: selectResult?.mockeryScore,
			ownerAttackScore: selectResult?.ownerAttackScore,
			userAttackScore: selectResult?.userAttackScore,
			sexualScore: selectResult?.sexualScore,
			goreScore: selectResult?.goreScore,
		};

		expect(scoreResult).toStrictEqual(scoreObj);
	});

	it.each([
		{isOwner: true, label: "프로필 제작자가"},
		{isOwner: false, label: "프로필 제작자가 아닌"},
	] as const)("$label 사용자가 코멘트를 작성하면 isOwner가 $isOwner 로 되어야 한다", async ({isOwner}) => {
		const uuid: string = fixture.publicUuid;
		const comment: string = "이 코멘트는 제작자가 작성한 코멘트일까";

		loginAs(isOwner ? fixture.ownerId : fixture.otherId);

		await writeComment({uuid, comment});

		expect(mocks.setCommentScoreIfOwner).toHaveBeenLastCalledWith(expect.anything(), isOwner);
	});

	it("코멘트 작성 후, 5초 이내에 다시 요청하면 거부되어야 한다", async () => {
		loginAs(fixture.otherId);

		const uuid: string = fixture.publicUuid;
		const comment: string = "연속 코멘트";

		const firstResult = await writeComment({uuid, comment});

		expect(firstResult.success, "첫번째 코멘트는 작성되어야 한다").toBe(true);

		mocks.claimCommentJudge.mockResolvedValue(false);

		const secondResult = await writeComment({uuid, comment});

		expect(secondResult).toStrictEqual({
			success: false,
			message: COMMENT_MESSAGE.writeTooFast,
		});
		expect(mocks.judgeComment).callCount(1);
	});

	it("코멘트 작성 시, 판정에 실패하면 rejudgeCount 컬럼이 0이어야 한다", async () => {
		mocks.judgeComment.mockResolvedValueOnce(mocks.JUDGE_COMMENT_NULL_RESULT);
		mocks.judgeCommentScore.mockReturnValueOnce({
			isPass: true,
			isBlind: false,
			isDeny: false,
			highestScoreType: null,
			retry: true,
		});

		loginAs(fixture.otherId);

		const uuid: string = fixture.publicUuid;
		const charId: bigint = fixture.publicCharId;
		const comment: string = "판정 실패될 코멘트";

		await writeComment({uuid, comment});

		const result = await db.characterComment.findFirst({
			where: {
				charId,
				charComment: comment,
			},
			select: {
				rejudgeCount: true,
			},
		});

		expect(result?.rejudgeCount).toBe(0);
	});

	it("코멘트 판정 킬 스위치가 꺼져 있으면 rejudgeCount 컬럼이 null이어야 한다", async () => {
		mocks.getCommentJudgeEnabled.mockResolvedValueOnce(false);
		mocks.judgeCommentScore.mockReturnValueOnce({
			isPass: true,
			isBlind: false,
			isDeny: false,
			highestScoreType: null,
			retry: true,
		});

		loginAs(fixture.otherId);

		const uuid: string = fixture.publicUuid;
		const charId: bigint = fixture.publicCharId;
		const comment: string = "킬 스위치가 꺼진 채 작성된 코멘트";

		await writeComment({uuid, comment});

		const result = await db.characterComment.findFirst({
			where: {
				charId,
				charComment: comment,
			},
			select: {
				rejudgeCount: true,
			},
		});

		expect(result?.rejudgeCount).toBeNull();
		expect(mocks.judgeComment).not.toHaveBeenCalled();
	});
});

describe("코멘트 수정", () => {
	it("다른 사용자의 코멘트를 수정하면 거부되어야 한다", async () => {
		const uuid: string = fixture.publicUuid;
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.publicCharId;

		loginAs(userId);

		const commentId: string = await createComment(charId, userId, {
			comment: "테스트 코멘트",
		});

		loginAs(fixture.otherId);

		const result = await editComment({uuid, comment: "수정된 코멘트", commentId});

		expect(result).toStrictEqual({
			success: false,
			message: COMMENT_MESSAGE.editNotOwner,
		});
		expect(mocks.judgeComment).not.toHaveBeenCalled();
	});

	it("코멘트를 수정하면 updatedAt 컬럼이 null이 아니어야 한다", async () => {
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;

		loginAs(userId);

		const beforeComment: string = "수정 전 코멘트";

		const commentId: string = await createComment(charId, userId, {
			comment: beforeComment,
		});

		const afterComment: string = "수정 후 코멘트";

		const editResult = await editComment({uuid, commentId, comment: afterComment});

		expect(editResult).toStrictEqual({success: true});

		const getResult = await readComment(commentId);

		expect(getResult?.charComment).toBe(afterComment);
		expect(getResult?.updatedAt).toBeInstanceOf(Date);
	});

	it("삭제된 코멘트는 수정이 거부되어야 한다", async () => {
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;

		loginAs(userId);

		const commentId: string = await createComment(charId, userId, {
			comment: "테스트 코멘트",
			deletedAt: new Date(),
		});

		const result = await editComment({uuid, commentId, comment: "수정되지 않을 테스트 코멘트"});

		expect(result).toStrictEqual({
			success: false,
			message: COMMENT_MESSAGE.notFound,
		});
		expect(mocks.judgeComment).not.toHaveBeenCalled();
	});

	it.each([
		{name: "spamScore", label: "스팸 코멘트"},
		{name: "mockeryScore", label: "과도한 프로필 조롱 및 거친 비하"},
		{name: "ownerAttackScore", label: "프로필 제작자 공격"},
		{name: "userAttackScore", label: "다른 사용자 공격"},
	] as const)("$label 판정 점수가 90 이상이면 거부 되어야 한다", async ({name, label}) => {
		mocks.judgeCommentScore.mockReturnValueOnce({
			isPass: false,
			isBlind: false,
			isDeny: true,
			highestScoreType: name,
			retry: false,
		});

		const uuid: string = fixture.publicUuid;
		const charId: bigint = fixture.publicCharId;
		const userId: string = fixture.otherId;
		const comment: string = `작성 성공된 코멘트 - ${label}`;

		loginAs(userId);

		const commentId: string = await createComment(charId, userId, {
			comment,
		});

		const result = await editComment({uuid, comment: "수정될 수 없는 코멘트", commentId});

		expect(result).toStrictEqual({
			success: false,
			message: COMMENT_MESSAGE.deny[name],
		});

		const selectResult = await db.characterComment.findUnique({
			where: {
				charId,
				commentId: BigInt(commentId),
			},
			select: {
				charComment: true,
			},
		});

		expect(selectResult?.charComment).toBe(comment);
	});

	it("기존에 블라인드 처리된 코멘트를 수정해서 통과하고, 새 점수가 블라인드 기준보다 낮으면 블라인드가 해제되어야 한다", async () => {
		const userId: string = fixture.otherId;
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;
		const comment: string = "작성된 코멘트";

		loginAs(userId);

		const commentId: string = await createComment(charId, userId, {
			comment,
			score: {
				spamScore: 80,
				mockeryScore: 80,
				ownerAttackScore: 80,
				userAttackScore: 80,
				sexualScore: 80,
				goreScore: 80,
			},
		});

		const firstResult = await getCommentsByTemplate(uuid);

		expect(firstResult?.[0].blinded, "판정 점수가 75점 이상이니 블라인드 되어야 한다").toBe(true);

		mocks.judgeComment.mockResolvedValueOnce({
			spamScore: 10,
			mockeryScore: 20,
			ownerAttackScore: 30,
			userAttackScore: 30,
			sexualScore: 20,
			goreScore: 10,
		});

		await editComment({uuid, comment: "수정된 코멘트", commentId});

		const secondResult = await getCommentsByTemplate(uuid);

		expect(secondResult?.[0].blinded).toBe(false);
	});

	it.each([
		{isOwner: true, label: "프로필 제작자가"},
		{isOwner: false, label: "프로필 제작자가 아닌"},
	] as const)("$label 사용자가 코멘트를 수정하면 isOwner가 $isOwner 로 되어야 한다", async ({isOwner}) => {
		const uuid: string = fixture.publicUuid;
		const userId: string = isOwner ? fixture.ownerId : fixture.otherId;
		const charId: bigint = fixture.publicCharId;
		const comment: string = "이 코멘트는 제작자가 수정한 코멘트일까";

		loginAs(userId);

		const commentId: string = await createComment(charId, userId, {
			comment,
		});

		await editComment({uuid, comment: comment + "? 으으음.", commentId});

		expect(mocks.setCommentScoreIfOwner).toHaveBeenLastCalledWith(expect.anything(), isOwner);
	});

	it("코멘트 수정 후, 5초 이내에 다시 요청하면 거부되어야 한다", async () => {
		const userId: string = fixture.otherId;
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;
		const comment: string = "수정된 코멘트";

		loginAs(userId);

		const firstCommentId: string = await createComment(charId, userId, {
			comment,
		});
		const secondCommentId: string = await createComment(charId, userId, {
			comment,
		});

		mocks.claimCommentJudge.mockResolvedValue(false);

		const firstResult = await editComment({uuid, comment, commentId: firstCommentId});

		expect(firstResult).toStrictEqual({
			success: false,
			message: COMMENT_MESSAGE.editTooFast,
		});

		const secondResult = await editComment({uuid, comment, commentId: secondCommentId});

		expect(secondResult, "다른 코멘트 수정 요청도 거부되어야 한다").toStrictEqual({
			success: false,
			message: COMMENT_MESSAGE.editTooFast,
		});
		expect(mocks.judgeComment).not.toHaveBeenCalled();
	});

	it("코멘트 수정 시, 판정에 성공하면 rejudgeCount 컬럼이 null이어야 한다", async () => {
		mocks.judgeCommentScore.mockReturnValue({
			isPass: true,
			isBlind: false,
			isDeny: false,
			highestScoreType: null,
			retry: false,
		});

		const uuid: string = fixture.publicUuid;
		const userId: string = fixture.otherId;
		const charId: bigint = fixture.publicCharId;
		const comment: string = "작성된 코멘트";

		loginAs(userId);

		const firstCommentId: string = await createComment(charId, userId, {
			comment,
			rejudgeCount: null,
		});

		const secondCommentId: string = await createComment(charId, userId, {
			comment,
			rejudgeCount: 3,
		});

		const firstResult = await editComment({uuid, comment: "수정된 코멘트", commentId: firstCommentId});

		expect(firstResult.success).toBe(true);

		const secondResult = await editComment({uuid, comment: "수정된 코멘트", commentId: secondCommentId});

		expect(secondResult.success).toBe(true);

		const selectResult = await db.characterComment.findMany({
			where: {
				charId,
				commentId: {
					in: [parseInt(firstCommentId, 10), parseInt(secondCommentId, 10)],
				},
			},
		});

		expect(selectResult.map((comment) => comment.rejudgeCount)).toStrictEqual([null, null]);
	});

	it("코멘트 수정 시, 판정에 실패하면 rejudgeCount 컬럼이 0이어야 한다", async () => {
		mocks.judgeComment.mockResolvedValue(mocks.JUDGE_COMMENT_NULL_RESULT);
		mocks.judgeCommentScore.mockReturnValue({
			isPass: true,
			isBlind: false,
			isDeny: false,
			highestScoreType: null,
			retry: true,
		});

		const uuid: string = fixture.publicUuid;
		const userId: string = fixture.otherId;
		const charId: bigint = fixture.publicCharId;
		const comment: string = "작성된 코멘트";

		loginAs(userId);

		const firstCommentId: string = await createComment(charId, userId, {
			comment,
			rejudgeCount: null,
			score: {spamScore: 10, mockeryScore: 20, ownerAttackScore: 30, userAttackScore: 40, sexualScore: 50, goreScore: 60},
		});

		const secondCommentId: string = await createComment(charId, userId, {
			comment,
			rejudgeCount: 3,
			score: {spamScore: 10, mockeryScore: 20, ownerAttackScore: 30, userAttackScore: 40, sexualScore: 50, goreScore: 60},
		});

		const firstResult = await editComment({uuid, comment: "수정된 코멘트", commentId: firstCommentId});

		expect(firstResult.success).toBe(true);

		const secondResult = await editComment({uuid, comment: "수정된 코멘트", commentId: secondCommentId});

		expect(secondResult.success).toBe(true);

		const selectResult = await db.characterComment.findMany({
			where: {
				charId,
				commentId: {
					in: [parseInt(firstCommentId, 10), parseInt(secondCommentId, 10)],
				},
			},
		});

		expect(selectResult.map((comment) => comment.rejudgeCount)).toStrictEqual([0, 0]);
	});

	it("코멘트 판정 킬 스위치가 꺼져 있으면 rejudgeCount 컬럼이 null이어야 한다", async () => {
		const uuid: string = fixture.publicUuid;
		const userId: string = fixture.otherId;
		const charId: bigint = fixture.publicCharId;
		const comment: string = "킬 스위치가 안 꺼진 채 작성된 코멘트";

		loginAs(userId);

		const firstCommentId: string = await createComment(charId, userId, {
			comment,
			rejudgeCount: null,
		});

		const secondCommentId: string = await createComment(charId, userId, {
			comment,
			rejudgeCount: 3,
		});

		mocks.getCommentJudgeEnabled.mockResolvedValue(false);
		mocks.judgeCommentScore.mockReturnValue({
			isPass: true,
			isBlind: false,
			isDeny: false,
			highestScoreType: null,
			retry: true,
		});

		const firstResult = await editComment({uuid, comment: "킬 스위치가 꺼진채 수정된 코멘트", commentId: firstCommentId});

		expect(firstResult.success).toBe(true);

		const secondResult = await editComment({uuid, comment: "킬 스위치가 꺼진채 수정된 코멘트", commentId: secondCommentId});

		expect(secondResult.success).toBe(true);

		const selectResult = await db.characterComment.findMany({
			where: {
				charId,
				commentId: {
					in: [parseInt(firstCommentId, 10), parseInt(secondCommentId, 10)],
				},
			},
			select: {
				spamScore: true,
				mockeryScore: true,
				ownerAttackScore: true,
				userAttackScore: true,
				sexualScore: true,
				goreScore: true,
				rejudgeCount: true,
			},
		});

		expect(selectResult.map((comment) => comment.rejudgeCount)).toStrictEqual([null, null]);
		expect(
			selectResult.map((comment) => ({
				spamScore: comment.spamScore,
				mockeryScore: comment.mockeryScore,
				ownerAttackScore: comment.ownerAttackScore,
				userAttackScore: comment.userAttackScore,
				sexualScore: comment.sexualScore,
				goreScore: comment.goreScore,
			}))
		).toStrictEqual([mocks.JUDGE_COMMENT_NULL_RESULT, mocks.JUDGE_COMMENT_NULL_RESULT]);
		expect(mocks.judgeComment).not.toHaveBeenCalled();
	});
});

describe("코멘트 삭제", () => {
	it("코멘트를 삭제하면 행이 남은 채 deletedAt 컬럼이 null이 아니어야 한다", async () => {
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;

		loginAs(userId);

		const commentId: string = await createComment(charId, userId, {
			comment: "테스트 코멘트",
		});

		const deleteResult = await deleteComment({uuid, commentId});

		expect(deleteResult).toStrictEqual({success: true});

		const result = await readComment(commentId);

		expect(result?.deletedAt).toBeInstanceOf(Date);
	});

	it("다른 사용자의 코멘트를 삭제하면 거부되어야 한다", async () => {
		const uuid: string = fixture.publicUuid;
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.publicCharId;

		loginAs(userId);

		const commentId: string = await createComment(charId, userId, {
			comment: "테스트 코멘트",
		});

		loginAs(fixture.otherId);

		const result = await deleteComment({uuid, commentId});

		expect(result).toStrictEqual({
			success: false,
			message: COMMENT_MESSAGE.deleteNotOwner,
		});
	});

	it("코멘트를 두 번 지우면 거부되어야 한다", async () => {
		const uuid: string = fixture.publicUuid;
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.publicCharId;

		loginAs(userId);

		const commentId: string = await createComment(charId, userId, {
			comment: "테스트 코멘트",
		});

		const firstResult = await deleteComment({uuid, commentId});

		expect(firstResult, "첫 번째 삭제는 성공해야 한다").toStrictEqual({success: true});

		const secondResult = await deleteComment({uuid, commentId});

		expect(secondResult, "두 번째 삭제는 거부되어야 한다").toStrictEqual({
			success: false,
			message: COMMENT_MESSAGE.notFound,
		});
	});
});

describe("코멘트 숨김", () => {
	it("프로필 제작자가 아닌 사용자가 숨김 요청을 하면 거부되어야 한다", async () => {
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;

		const commentId: string = await createComment(charId, fixture.ownerId, {
			comment: "테스트 코멘트",
		});

		loginAs(fixture.otherId);

		const result = await hideComment({uuid, commentId});

		expect(result).toStrictEqual({
			success: false,
			message: COMMENT_MESSAGE.hideNotUploader.hide,
		});
	});

	it("프로필 제작자가 자신의 코멘트에 숨김 요청을 하면 거부되어야 한다", async () => {
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;

		loginAs(userId);

		const commentId: string = await createComment(charId, userId, {
			comment: "테스트 코멘트",
		});

		const result = await hideComment({uuid, commentId});

		expect(result).toStrictEqual({
			success: false,
			message: COMMENT_MESSAGE.hideSelf.hide,
		});
	});

	it("코멘트 숨김 요청마다 숨김 여부가 번갈아 바뀌어야 한다", async () => {
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;

		const commentId: string = await createComment(charId, fixture.otherId, {
			comment: "테스트 코멘트",
		});

		loginAs(fixture.ownerId);

		const firstHideResult = await hideComment({uuid, commentId});

		expect(firstHideResult, "첫 번째 요청은 숨겨져야 한다").toStrictEqual({
			success: true,
			result: "hide",
		});

		const firstGetResult = await readComment(commentId);

		expect(firstGetResult?.hiddenAt, "첫 번째 요청은 숨겨져야 한다").toBeInstanceOf(Date);

		const secondHideResult = await hideComment({uuid, commentId});

		expect(secondHideResult, "두 번째 요청은 표시되어야 한다").toStrictEqual({
			success: true,
			result: "show",
		});

		const secondGetResult = await readComment(commentId);

		expect(secondGetResult?.hiddenAt, "두 번째 요청은 표시되어야 한다").toBeNull();
	});

	it("동시에 요청해도 둘 다 숨김으로 성공하면 안 된다", async () => {
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;

		const commentId: string = await createComment(charId, fixture.otherId, {
			comment: "테스트 코멘트",
		});

		loginAs(fixture.ownerId);

		const hideResult = await Promise.all([hideComment({uuid, commentId}), hideComment({uuid, commentId})]);

		expect(hideResult).not.toStrictEqual([
			{success: true, result: "hide"},
			{success: true, result: "hide"},
		]);
	});
});

describe("코멘트 목록", () => {
	it("삭제된 코멘트는 목록에서 제외되어야 한다", async () => {
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;
		const comment: string = "테스트 코멘트";

		const commentIdList = await Array.fromAsync({length: 3}, (_, index) => createComment(charId, userId, {comment, deletedAt: index === 1 ? new Date() : null}));

		const result = await getCommentsByTemplate(uuid);

		expect(result?.map((list) => list.commentId)).toStrictEqual([commentIdList[0], commentIdList[2]]);
	});

	it("숨겨진 코멘트는 hidden이 true여야 한다", async () => {
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;
		const comment: string = "숨겨진 테스트 코멘트";

		await createComment(charId, userId, {
			comment,
			hiddenAt: new Date(),
		});

		const result = await getCommentsByTemplate(uuid);

		expect(result?.[0].hidden).toBe(true);
		expect(result?.[0].charComment).toBe(comment);
	});

	it("코멘트는 오래된 순으로 정렬되어야 한다", async () => {
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;

		const dateList: Date[] = [new Date("2026-01-03T00:00:00Z"), new Date("2026-01-02T00:00:00Z"), new Date("2026-01-01T00:00:00Z")];

		const commentIdList = await Array.fromAsync(dateList, (date, index) => createComment(charId, userId, {comment: `${index}번째 코멘트`, createdAt: date}));

		const result = await getCommentsByTemplate(uuid);

		expect(result?.map((list) => list.commentId)).toStrictEqual(commentIdList.toReversed());
	});

	it("createdAt 컬럼이 같아도 commentId 순서로 정렬되어야 한다", async () => {
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;

		const date: Date = new Date("2026-01-03T00:00:00Z");

		const commentIdList = await Array.fromAsync({length: 3}, (_, index) => createComment(charId, userId, {comment: `${index}번째 코멘트`, createdAt: date}));

		const result = await getCommentsByTemplate(uuid);

		expect(result?.map((list) => list.commentId)).toStrictEqual(commentIdList);
	});

	it("비공개 프로필의 코멘트 목록은 null이어야 한다", async () => {
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.privateCharId;
		const uuid: string = fixture.privateUuid;

		const firstResult = await getCommentsByTemplate(uuid);

		expect(firstResult, "코멘트가 없어도 null을 반환해야 한다").toBeNull();

		await createComment(charId, userId, {
			comment: "테스트 코멘트",
		});

		const secondResult = await getCommentsByTemplate(uuid);

		expect(secondResult, "코멘트가 있으면 null을 반환해야 한다").toBeNull();
	});

	it.each([
		{name: "spamScore", label: "스팸 코멘트"},
		{name: "mockeryScore", label: "과도한 프로필 조롱 및 거친 비하"},
		{name: "ownerAttackScore", label: "프로필 제작자 공격"},
		{name: "userAttackScore", label: "다른 사용자 공격"},
		{name: "sexualScore", label: "성적 코멘트"},
		{name: "goreScore", label: "고어 코멘트"},
	] as const)("$label 점수가 75 이상이면 blinded가 true여야 한다", async ({name}) => {
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;

		await createComment(charId, userId, {
			comment: "블라인드된 코멘트",
			score: {
				[name]: 75,
			},
		});

		const result = await getCommentsByTemplate(uuid);

		expect(result?.[0].blinded).toBe(true);
	});

	it("코멘트 판정 점수가 75 미만이거나 null이면 blinded가 false여야 한다", async () => {
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;

		await createComment(charId, userId, {
			comment: "블라인드안된 코멘트",
			score: {
				spamScore: 74,
			},
		});
		await createComment(charId, userId, {
			comment: "검사받지않은 코멘트",
		});

		const result = await getCommentsByTemplate(uuid);

		expect(result?.map((comment) => comment.blinded)).toStrictEqual([false, false]);
	});

	it("코멘트 목록에 판정 점수가 반환되지 않아야 한다", async () => {
		const userId: string = fixture.ownerId;
		const charId: bigint = fixture.publicCharId;
		const uuid: string = fixture.publicUuid;

		await createComment(charId, userId, {
			comment: "판정 점수 있는 코멘트",
			score: {
				spamScore: 10,
				mockeryScore: 10,
				ownerAttackScore: 10,
				userAttackScore: 10,
				sexualScore: 10,
				goreScore: 10,
			},
		});
		await createComment(charId, userId, {
			comment: "판정 점수 없는 코멘트",
		});

		const selectResult = await getCommentsByTemplate(uuid);

		const commentKeys: string[] = ["commentId", "userName", "charComment", "createdAt", "updated", "hidden", "isMine", "blinded"].toSorted();

		const result = selectResult?.map((comment) => Object.keys(comment).toSorted());

		expect(result).toStrictEqual([commentKeys, commentKeys]);
	});
});
