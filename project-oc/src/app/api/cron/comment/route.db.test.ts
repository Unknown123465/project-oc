import {afterAll, afterEach, beforeAll, describe, expect, it, vi} from "vitest";
import {v7 as uuidv7} from "uuid";
import db from "@/prisma/client";
import {uuidToBin} from "@/prisma/uuid";
import {PUBLIC_MODE_PUBLIC} from "@/app/create/r2";
import {GET} from "./route";
import {JudgeScore} from "@/app/template/[uuid]/commentJudge";

/* 재판정과 삭제는 실제로 남은 행으로만 확인할 수 있어 실제 DB를 탄다.

   판정과 킬 스위치는 기본값이 "항상 통과"인 vi.fn()이다. 테스트에서 다른 결과가 필요하면
   mockResolvedValueOnce, mockReturnValueOnce로 그 호출만 바꾼다.
   CRON_SECRET, DELETE_COMMENT_AFTER_DAYS는 route.ts가 import될 때 읽어서 여기서 먼저 넣는다. */
const mocks = vi.hoisted(() => {
	process.env.CRON_SECRET = "comment-cron-test-secret";
	process.env.DELETE_COMMENT_AFTER_DAYS = "30";
	process.env.TYPESAFE_API_KEY = "comment-cron-test-key";

	return {
		getCommentJudgeEnabled: vi.fn(async (): Promise<boolean> => true),
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

/* 킬 스위치의 실제 값을 읽으면 Vercel에 저장된 값에 따라 결과가 달라진다. */
vi.mock("@/app/create/globalConfig", () => ({getCommentJudgeEnabled: mocks.getCommentJudgeEnabled}));

/* 실제 Jev 요청을 보내지 않는다. commentJudge.ts의 server-only도 Vitest에서 찾을 수 없어 파일째 대체한다. */
vi.mock("@/app/template/[uuid]/commentJudge", () => ({
	judgeComment: mocks.judgeComment,
	judgeCommentScore: mocks.judgeCommentScore,
	setCommentScoreIfOwner: mocks.setCommentScoreIfOwner,
}));

/* 파일 전체가 같이 쓰는 행. 제작자의 프로필 하나에 제작자(owner)와 다른 회원(other)이 코멘트를 쓴다. */
const fixture = {
	ownerId: "",
	otherId: "",
	charId: BigInt(0),
};

/** 서버 액션을 거치지 않고 코멘트 행을 바로 넣는다. 재판정 대기, 삭제 후 경과 같은 상태를 미리 만들어 둘 때 쓴다.
 *  돌려주는 값은 DB 조회에 쓸 commentId다. */
async function createComment(userId: string, options: {comment?: string; deletedAt?: Date | null; rejudgeCount?: number | null} = {}): Promise<bigint> {
	const comment = await db.characterComment.create({
		data: {
			charId: fixture.charId,
			userId,
			charComment: options.comment ?? "테스트 코멘트",
			deletedAt: options.deletedAt ?? null,
			rejudgeCount: options.rejudgeCount ?? null,
		},
		select: {commentId: true},
	});

	return comment.commentId;
}

/** 크론이 남긴 행을 그대로 읽는다. 지워졌으면 null이다. */
async function readComment(commentId: bigint) {
	return await db.characterComment.findUnique({
		where: {
			commentId,
		},
	});
}

beforeAll(async () => {
	const [owner, other] = await Promise.all([
		db.user.create({data: {name: "comment-cron-test-owner", username: "comment-cron-test-owner"}}),
		db.user.create({data: {name: "comment-cron-test-other", username: "comment-cron-test-other"}}),
	]);

	fixture.ownerId = owner.id;
	fixture.otherId = other.id;

	const character = await db.character.create({
		data: {
			charName: "크론테스트",
			/* 이미지는 읽지 않는다. 컬럼 길이(41)만 맞춘다. */
			charImage: "comment-cron-00000000000000000000000.webp",
			charProfileLayout: "h",
			charImageFrame: "square",
			charMessage: "크론 테스트",
			charPublicMode: PUBLIC_MODE_PUBLIC,
			aiUsed: 0,
			charPublicLink: uuidToBin(uuidv7()),
			charUploaderId: fixture.ownerId,
		},
		select: {charId: true},
	});

	fixture.charId = character.charId;
});

/* 테스트마다 코멘트를 비운다. 크론은 DB 전체의 코멘트를 읽어서 앞 테스트가 남긴 행도 처리 대상이 된다. */
afterEach(async () => {
	await db.characterComment.deleteMany({where: {charId: fixture.charId}});
	mocks.getCommentJudgeEnabled.mockReset();
	mocks.judgeComment.mockReset();
	mocks.judgeCommentScore.mockReset();
	mocks.setCommentScoreIfOwner.mockReset();
	vi.unstubAllEnvs();
});

afterAll(async () => {
	/* 코멘트는 Character에 Cascade라 같이 지워진다. Character → User는 Cascade가 없어 캐릭터부터 지운다. */
	await db.character.deleteMany({where: {charId: fixture.charId}});
	await db.user.deleteMany({where: {id: {in: [fixture.ownerId, fixture.otherId]}}});
	await db.$disconnect();
});

const CRON_URL = "http://localhost/api/cron/comment" as const;

function genRequest(): Request {
	return new Request(CRON_URL, {
		headers: {
			Authorization: `Bearer ${process.env.CRON_SECRET}`,
		},
	});
}

function genEmptyHeaderRequest(): Request {
	return new Request(CRON_URL);
}

function genWrongHeaderRequest(): Request {
	return new Request(CRON_URL, {
		headers: {
			Authorization: `Bearer wrong-key`,
		},
	});
}

describe("코멘트 크론", () => {
	it("Authorization 헤더가 없으면 HTTP 401을 응답해야 한다", async () => {
		const response = await GET(genEmptyHeaderRequest());

		expect(response.status).toBe(401);
	});

	it("Authorization 헤더가 틀리면 HTTP 401을 응답해야 한다", async () => {
		const response = await GET(genWrongHeaderRequest());

		expect(response.status).toBe(401);
	});

	it("코멘트 재판정에 성공하면 rejudgeCount가 null이어야 한다", async () => {
		const mockScoreObj = {
			spamScore: 10,
			mockeryScore: 20,
			ownerAttackScore: 30,
			userAttackScore: 30,
			sexualScore: 20,
			goreScore: 10,
		};

		mocks.judgeComment.mockResolvedValueOnce(mockScoreObj);

		const userId: string = fixture.ownerId;
		const comment: string = "재검사해야 하는 코멘트";

		const commentId: bigint = await createComment(userId, {
			comment,
			rejudgeCount: 1,
		});

		const response = await GET(genRequest());

		expect(response.status, "크론 응답은 200이어야 한다").toBe(200);

		const selectResult = await readComment(commentId);

		const resultScoreObj: JudgeScore<number | null | undefined> = {
			spamScore: selectResult?.spamScore,
			mockeryScore: selectResult?.mockeryScore,
			ownerAttackScore: selectResult?.ownerAttackScore,
			userAttackScore: selectResult?.userAttackScore,
			sexualScore: selectResult?.sexualScore,
			goreScore: selectResult?.goreScore,
		};

		expect(selectResult?.rejudgeCount).toBeNull();
		expect(resultScoreObj).toStrictEqual(mockScoreObj);
	});

	it("rejudgeCount 컬럼이 5인 코멘트는 재판정 대상에 들어가지 않아야 한다", async () => {
		const userId: string = fixture.ownerId;
		const comment: string = "재검사하지 말아야 하는 코멘트";

		const rejudgeCount = 5 as const;

		const commentId: bigint = await createComment(userId, {
			comment,
			rejudgeCount,
		});

		const response = await GET(genRequest());

		expect(response.status, "크론 응답은 200이어야 한다").toBe(200);

		const selectResult = await readComment(commentId);

		const scoreObj: JudgeScore<number | null | undefined> = {
			spamScore: selectResult?.spamScore,
			mockeryScore: selectResult?.mockeryScore,
			ownerAttackScore: selectResult?.ownerAttackScore,
			userAttackScore: selectResult?.userAttackScore,
			sexualScore: selectResult?.sexualScore,
			goreScore: selectResult?.goreScore,
		};

		expect(selectResult?.rejudgeCount).toBe(rejudgeCount);
		expect(scoreObj).toStrictEqual({
			spamScore: null,
			mockeryScore: null,
			ownerAttackScore: null,
			userAttackScore: null,
			sexualScore: null,
			goreScore: null,
		});
	});

	it("코멘트 재판정 중 본문이 바뀌면 재판정 점수가 DB에 반영되지 않아야 한다", async () => {
		const userId: string = fixture.otherId;
		const comment: string = "수정 전 코멘트";

		const rejudgeCount = 0 as const;

		const commentId: bigint = await createComment(userId, {
			comment,
			rejudgeCount,
		});

		mocks.judgeComment.mockImplementationOnce(async () => {
			await db.characterComment.update({
				data: {
					charComment: "수정 후 코멘트",
					updatedAt: new Date(),
				},
				where: {
					commentId,
				},
			});

			return {
				spamScore: 60,
				mockeryScore: 70,
				ownerAttackScore: 65,
				userAttackScore: 60,
				sexualScore: 65,
				goreScore: 20,
			};
		});

		await GET(genRequest());

		const selectResult = await readComment(commentId);

		const scoreObj: JudgeScore<number | null | undefined> = {
			spamScore: selectResult?.spamScore,
			mockeryScore: selectResult?.mockeryScore,
			ownerAttackScore: selectResult?.ownerAttackScore,
			userAttackScore: selectResult?.userAttackScore,
			sexualScore: selectResult?.sexualScore,
			goreScore: selectResult?.goreScore,
		};

		expect(selectResult?.rejudgeCount).toBe(rejudgeCount);
		expect(scoreObj).toStrictEqual({
			spamScore: null,
			mockeryScore: null,
			ownerAttackScore: null,
			userAttackScore: null,
			sexualScore: null,
			goreScore: null,
		});
		expect(mocks.judgeComment).toHaveBeenCalledTimes(1);
	});

	it("코멘트 재판정 시, 프로필 제작자의 코멘트면 setCommentScoreIfOwner에서 isOwner가 true로 전달되고, 그렇지 않으면 false가 전달되어야 한다", async () => {
		const comment: string = "테스트 코멘트";

		const rejudgeCount = 0 as const;

		await createComment(fixture.ownerId, {
			comment,
			rejudgeCount,
		});

		await GET(genRequest());

		expect(mocks.setCommentScoreIfOwner, "프로필 제작자의 코멘트는 isOwner가 true여야 한다").toHaveBeenLastCalledWith(expect.anything(), true);

		await createComment(fixture.otherId, {
			comment,
			rejudgeCount,
		});

		await GET(genRequest());

		expect(mocks.setCommentScoreIfOwner, "프로필 제작자가 아닌 코멘트는 isOwner가 false여야 한다").toHaveBeenLastCalledWith(expect.anything(), false);
	});

	it("삭제된 지 30일 지난 코멘트는 삭제되어야 하고, 그렇지 않은 코멘트는 삭제되지 말아야 한다", async () => {
		const userId: string = fixture.ownerId;

		const firstCommentId: bigint = await createComment(userId, {
			comment: "삭제되어야 할 코멘트",
			deletedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 31),
		});
		const secondCommentId: bigint = await createComment(userId, {
			comment: "삭제되지 말아야 할 코멘트",
			deletedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
		});
		const thirdCommentId: bigint = await createComment(userId, {
			comment: "역시 삭제되지 말아야 할 코멘트",
		});

		await GET(genRequest());

		const [firstResult, secondResult, thirdResult] = await Promise.all([readComment(firstCommentId), readComment(secondCommentId), readComment(thirdCommentId)]);

		expect(firstResult, "삭제된 지 30일 지난 코멘트는 삭제되어야 한다").toBeNull();
		expect(secondResult, "삭제된 지 30일이 안 지난 코멘트는 삭제되지 말아야 한다").not.toBeNull();
		expect(thirdResult, "삭제되지 않은 코멘트도 역시 삭제되지 말아야 한다").not.toBeNull();
	});

	it("환경 변수 TYPESAFE_API_KEY가 없으면 judgeComment가 호출되지 말아야 하고, 삭제된 지 30일 지난 코멘트는 삭제되어야 한다", async () => {
		vi.stubEnv("TYPESAFE_API_KEY", "");

		const userId: string = fixture.ownerId;

		const rejudgeCount = 0 as const;

		const firstCommentId: bigint = await createComment(userId, {
			comment: "재판정 코멘트",
			rejudgeCount,
		});
		const secondCommentId: bigint = await createComment(userId, {
			comment: "30일 지난 코멘트",
			deletedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 31),
		});

		await GET(genRequest());

		expect(mocks.judgeComment).not.toHaveBeenCalled();

		const [firstResult, secondResult] = await Promise.all([readComment(firstCommentId), readComment(secondCommentId)]);

		expect(firstResult?.rejudgeCount, "환경 변수가 없으므로 재판정 횟수가 그대로여야 한다").toBe(rejudgeCount);
		expect(secondResult, "30일 지난 코멘트는 삭제되어야 한다").toBeNull();
	});

	it("코멘트 재판정 킬 스위치가 꺼지면 judgeComment가 호출되지 말아야 하고 rejudgeCount 컬럼도 그대로여야 하지만, 30일 지난 코멘트는 삭제되어야 한다", async () => {
		mocks.getCommentJudgeEnabled.mockResolvedValueOnce(false);

		const userId: string = fixture.otherId;

		const rejudgeCount = 0 as const;

		const firstCommentId: bigint = await createComment(userId, {
			comment: "삭제될 코멘트",
			deletedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 31),
		});
		const secondCommentId: bigint = await createComment(userId, {
			comment: "재판정을 받지 말아야 할 코멘트",
			rejudgeCount,
		});

		const response = await GET(genRequest());

		expect(response.status, "킬 스위치가 꺼져 있어도 HTTP 200을 응답해야 한다").toBe(200);
		expect(mocks.judgeComment, "킬 스위치가 꺼져 있으니 호출되면 안 된다").not.toHaveBeenCalled();

		const [firstResult, secondResult] = await Promise.all([readComment(firstCommentId), readComment(secondCommentId)]);

		expect(firstResult, "코멘트 삭제 작업은 하기 때문에 이 코멘트는 삭제되어야 한다").toBeNull();
		expect(secondResult?.rejudgeCount, "코멘트가 재판정이 안 되었기 때문에 재판정 횟수는 그대로여야 한다").toBe(rejudgeCount);
	});

	it("코멘트 재판정이 실패해 HTTP 500을 응답해도 삭제된 지 30일 지난 코멘트는 삭제되어야 한다", async () => {
		mocks.judgeComment.mockRejectedValueOnce(new Error("재판정에 실패함"));

		const userId: string = fixture.ownerId;

		const firstCommentId: bigint = await createComment(userId, {
			comment: "삭제될 코멘트",
			deletedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 31),
			rejudgeCount: 0,
		});
		const secondCommentId: bigint = await createComment(userId, {
			comment: "재판정될 코멘트",
			rejudgeCount: 0,
		});

		const response = await GET(genRequest());

		expect(response.status).toBe(500);

		const [firstResult, secondResult] = await Promise.all([readComment(firstCommentId), readComment(secondCommentId)]);

		expect(firstResult, "삭제된 지 30일 지난 코멘트는 삭제되어야 한다").toBeNull();
		expect(secondResult, "삭제되지 않은 코멘트는 보존되어야 한다").not.toBeNull();
	});

	it("코멘트 재판정 실패 시 rejudgeCount 컬럼이 1 올라야 한다", async () => {
		mocks.judgeCommentScore.mockReturnValueOnce({
			isPass: true,
			isBlind: false,
			isDeny: false,
			highestScoreType: null,
			retry: true,
		});

		const userId: string = fixture.ownerId;
		const comment: string = "재판정에 실패할 코멘트";

		const rejudgeCount = 0 as const;

		const commentId: bigint = await createComment(userId, {
			comment,
			rejudgeCount,
		});

		await GET(genRequest());

		const selectResult = await readComment(commentId);

		expect(selectResult?.rejudgeCount).toBe(rejudgeCount + 1);
	});
});
