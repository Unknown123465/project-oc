import {getCommentJudgeEnabled} from "@/app/create/globalConfig";
import {judgeComment, judgeCommentScore, JudgeScore, setCommentScoreIfOwner} from "@/app/template/[uuid]/commentJudge";
import db from "@/prisma/client";

interface ReJudgeResult {
	commentId: bigint;
	comment: string;
	score: JudgeScore<number | null>;
	retry: boolean;
}

const CRON_SECRET = process.env.CRON_SECRET;
const DELETE_COMMENT_AFTER_DAYS = typeof process.env.DELETE_COMMENT_AFTER_DAYS === "string" ? parseInt(process.env.DELETE_COMMENT_AFTER_DAYS, 10) : null;

async function startJudge(commentId: bigint, comment: string, isOwner: boolean): Promise<ReJudgeResult> {
	const score = setCommentScoreIfOwner(await judgeComment(comment), isOwner);

	const {retry} = judgeCommentScore(score);

	return {
		commentId,
		comment,
		score,
		retry,
	};
}

async function updateScore({commentId, comment, score, retry}: ReJudgeResult) {
	await db.characterComment.updateMany({
		data: {
			...score,
			rejudgeCount: retry ? {increment: 1} : null,
		},
		where: {
			commentId,
			charComment: comment,
			deletedAt: null,
		},
	});
}

async function rejudgeComment(): Promise<boolean> {
	try {
		const targetComment = await db.characterComment.findMany({
			where: {
				deletedAt: null,
				rejudgeCount: {
					lt: 5,
				},
			},
			select: {
				commentId: true,
				userId: true,
				charComment: true,
				character: {
					select: {
						charUploaderId: true,
					},
				},
			},
		});

		for (let index = 0; index < targetComment.length; index += 10) {
			const targetCommentGroup = targetComment.slice(index, index + 10);

			const judgeResult = await Promise.all(targetCommentGroup.map((target) => startJudge(target.commentId, target.charComment, target.userId === target.character.charUploaderId)));

			await Promise.allSettled(judgeResult.map(updateScore));
		}

		return true;
	} catch (err) {
		console.error(err);

		return false;
	}
}

async function deleteAfterDayComment(days: number): Promise<boolean> {
	try {
		const now: number = Date.now();

		await db.characterComment.deleteMany({
			where: {
				deletedAt: {
					lte: new Date(now - 1000 * 60 * 60 * 24 * days),
				},
			},
		});

		return true;
	} catch (err) {
		console.error(err);

		return false;
	}
}

export async function GET(request: Request): Promise<Response> {
	const authorization: string | null = request.headers.get("Authorization");

	if (!CRON_SECRET || !authorization || authorization !== `Bearer ${CRON_SECRET}`) {
		return Response.json({success: false}, {status: 401});
	}

	const judgeCommentEnabled: boolean = await getCommentJudgeEnabled();

	let success: boolean = true;

	if (judgeCommentEnabled && process.env.TYPESAFE_API_KEY) {
		const result: boolean = await rejudgeComment();

		success &&= result;
	}

	if (typeof DELETE_COMMENT_AFTER_DAYS === "number" && !Number.isNaN(DELETE_COMMENT_AFTER_DAYS) && DELETE_COMMENT_AFTER_DAYS > 0) {
		const result: boolean = await deleteAfterDayComment(DELETE_COMMENT_AFTER_DAYS);

		success &&= result;
	}

	return Response.json({success}, {status: success ? 200 : 500});
}
