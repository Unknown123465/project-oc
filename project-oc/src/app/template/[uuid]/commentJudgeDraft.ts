import db from "@/prisma/client";

const COMMENT_JUDGE_CALL_INTERVAL_SECONDS = 5 as const;

export async function claimCommentJudge(userId: string) {
	const nowDate: Date = new Date();
	const afterDate: Date = new Date(nowDate.getTime() - COMMENT_JUDGE_CALL_INTERVAL_SECONDS * 1000);

	const updated = await db.user.updateMany({
		data: {
			commentLastRequestAt: nowDate,
		},
		where: {
			id: userId,
			OR: [
				{
					commentLastRequestAt: {
						lte: afterDate,
					},
				},
				{
					commentLastRequestAt: null,
				},
			],
		},
	});

	return updated.count > 0;
}
