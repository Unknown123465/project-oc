import {describe, expect, it, vi, afterEach} from "vitest";
import {judgeCommentScore, JudgeScore, setCommentScoreIfOwner} from "./commentJudge";

type Score = number | null;

/* 임계값은 .env와 상관없이 고정한다. import보다 먼저 실행되도록 vi.hoisted에 넣는다. */
vi.hoisted(() => {
	process.env.BLIND_COMMENT_SCORE = "75";
	process.env.DENY_COMMENT_SCORE = "90";
});

/* server-only는 Next가 빌드할 때만 처리해서 Vitest에서는 찾을 수 없다. */
vi.mock("server-only", () => ({}));

afterEach(() => {
	vi.unstubAllEnvs();
});

function genJudgeScore(
	spamScore: Score = null,
	mockeryScore: Score = null,
	ownerAttackScore: Score = null,
	userAttackScore: Score = null,
	sexualScore: Score = null,
	goreScore: Score = null
): JudgeScore<Score> {
	return {
		spamScore,
		mockeryScore,
		ownerAttackScore,
		userAttackScore,
		sexualScore,
		goreScore,
	};
}

function genSameJudgeScore(score: Score) {
	return {
		spamScore: score,
		mockeryScore: score,
		ownerAttackScore: score,
		userAttackScore: score,
		sexualScore: score,
		goreScore: score,
	};
}

describe("코멘트 점수 판정", () => {
	it.each([60, 70, 74] as const)("모든 판정 점수가 75 미만이면 isPass가 true여야 한다", (value) => {
		const scoreObj = genSameJudgeScore(value);

		const result = judgeCommentScore(scoreObj);

		expect(result.isPass).toBe(true);
	});

	it.each([75, 82, 89] as const)("모든 판정 점수가 75 이상이고 90 미만이면 isBlind가 true여야 한다", (value) => {
		const scoreObj = genSameJudgeScore(value);

		const result = judgeCommentScore(scoreObj);

		expect(result.isBlind).toBe(true);
		expect(result.isPass, "isPass는 false여야 한다").toBe(false);
	});

	it.each([
		{
			scoreObj: genJudgeScore(90, 10, 10, 10, 10, 10),
			highestScoreType: "spamScore",
		},
		{
			scoreObj: genJudgeScore(10, 90, 10, 10, 10, 10),
			highestScoreType: "mockeryScore",
		},
		{
			scoreObj: genJudgeScore(10, 10, 90, 10, 10, 10),
			highestScoreType: "ownerAttackScore",
		},
		{
			scoreObj: genJudgeScore(10, 10, 10, 90, 10, 10),
			highestScoreType: "userAttackScore",
		},
	] as const)("거부 대상 4개 점수가 90 이상이고, 성적 및 고어 요소가 90 미만이면 isDeny가 true여야 하고, highestScoreType이 $highestScoreType 여야 한다", ({scoreObj, highestScoreType}) => {
		const result = judgeCommentScore(scoreObj);

		expect(result.isDeny).toBe(true);
		expect(result.highestScoreType).toBe(highestScoreType);
		expect(result.isBlind, "isDeny가 true니 isBlind는 false여야 한다").toBe(false);
	});

	it("성적 및 고어 점수가 90 이상이면 isBlind가 true여야 한다", () => {
		const scoreObj = genJudgeScore(60, 60, 60, 60, 91, 90);

		const result = judgeCommentScore(scoreObj);

		expect(result.isBlind).toBe(true);
		expect(result.isDeny, "isBlind가 true이기 때문에 isDeny는 false여야 한다").toBe(false);
	});

	it("스팸 점수가 85, 다른 사용자 공격 점수가 95, 성적 점수가 99면 isDeny가 true여야 하고, highestScoreType은 'userAttackScore'여야 한다", () => {
		const scoreObj = genJudgeScore(85, 60, 60, 95, 99, 60);

		const result = judgeCommentScore(scoreObj);

		expect(result.isDeny).toBe(true);
		expect(result.highestScoreType).toBe("userAttackScore");
	});

	it("모든 점수가 null이면 isPass와 retry가 true여야 한다", () => {
		const scoreObj = genSameJudgeScore(null);

		const result = judgeCommentScore(scoreObj);

		expect(result.isPass).toBe(true);
		expect(result.retry).toBe(true);
	});

	it("점수 중 하나라도 null이 있으면 isPass와 retry가 true여야 한다", () => {
		const scoreObj = genJudgeScore(10, null, 10, 10, 10, 10);

		const result = judgeCommentScore(scoreObj);

		expect(result.isPass).toBe(true);
		expect(result.retry).toBe(true);
	});

	it("블라인드 및 거부 상한 점수가 없고 판정 점수가 null이 아니면 retry가 false여야 한다", () => {
		vi.stubEnv("BLIND_COMMENT_SCORE", "");
		vi.stubEnv("DENY_COMMENT_SCORE", "");

		const scoreObj = genSameJudgeScore(50);

		const result = judgeCommentScore(scoreObj);

		expect(result.isPass).toBe(true);
		expect(result.retry).toBe(false);
	});

	it("블라인드 및 거부 상한 점수가 없고 판정 점수가 null이면 retry가 true여야 한다", () => {
		vi.stubEnv("BLIND_COMMENT_SCORE", "");
		vi.stubEnv("DENY_COMMENT_SCORE", "");

		const scoreObj = genSameJudgeScore(null);

		const result = judgeCommentScore(scoreObj);

		expect(result.isPass).toBe(true);
		expect(result.retry).toBe(true);
	});

	it("블라인드 및 거부 상한 점수가 숫자가 아니면 isPass가 true이되, 판정 점수가 null이면 retry가 true여야 한다", () => {
		vi.stubEnv("BLIND_COMMENT_SCORE", "not-a-number");
		vi.stubEnv("DENY_COMMENT_SCORE", "not-a-number-too");

		const scoreObj = genSameJudgeScore(null);

		const result = judgeCommentScore(scoreObj);

		expect(result.isPass).toBe(true);
		expect(result.retry).toBe(true);
	});

	it("블라인드 및 거부 상한 점수가 숫자가 아니면 isPass가 true이되, 판정 점수가 null이 아니면 retry가 false여야 한다", () => {
		vi.stubEnv("BLIND_COMMENT_SCORE", "   ");
		vi.stubEnv("DENY_COMMENT_SCORE", "123ad1as");

		const scoreObj = genSameJudgeScore(90);

		const result = judgeCommentScore(scoreObj);

		expect(result.isPass).toBe(true);
		expect(result.retry).toBe(false);
	});
});

describe("프로필 제작자가 작성한 코멘트 점수 판정", () => {
	it("프로필 제작자의 코멘트는 과도한 프로필 조롱 및 거친 비하와 프로필 제작자 공격 점수가 0이어야 한다", () => {
		const mustSameScore: number = 50;

		const scoreObj = genJudgeScore(mustSameScore, 60, 60, mustSameScore, mustSameScore, mustSameScore);

		const result = setCommentScoreIfOwner(scoreObj, true);

		expect(result).toStrictEqual({
			spamScore: mustSameScore,
			mockeryScore: 0,
			ownerAttackScore: 0,
			userAttackScore: mustSameScore,
			sexualScore: mustSameScore,
			goreScore: mustSameScore,
		});
	});

	it("프로필 제작자의 코멘트의 과도한 프로필 조롱 및 거친 비하와 프로필 제작자 공격 점수가 null이면 그대로 반환해야 한다", () => {
		const scoreObj = genSameJudgeScore(null);

		const result = setCommentScoreIfOwner(scoreObj, true);

		expect(result).toStrictEqual({
			spamScore: null,
			mockeryScore: null,
			ownerAttackScore: null,
			userAttackScore: null,
			sexualScore: null,
			goreScore: null,
		});
	});

	it("프로필 제작자의 코멘트가 아니면 과도한 프로필 조롱 및 거친 비하와 프로필 제작자 공격 점수는 그대로 반환해야 한다", () => {
		const mustSameScore: number = 50;

		const scoreObj = genJudgeScore(10, mustSameScore, mustSameScore, 10, 10, 10);

		const result = setCommentScoreIfOwner(scoreObj, false);

		expect(result.mockeryScore).toBe(mustSameScore);
		expect(result.ownerAttackScore).toBe(mustSameScore);
	});
});
