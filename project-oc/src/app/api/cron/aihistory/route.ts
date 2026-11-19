import db from "@/prisma/client";

const CRON_SECRET = process.env.CRON_SECRET;

/** 탈퇴한 계정의 AI 사용 기록을 남겨 두는 기간(일). 개인정보 처리방침에 적는 기간과 같아야 한다. */
const KEEP_WITHDRAWN_HISTORY_DAYS = 30 as const;

/* 탈퇴한 계정의 AiHistory를 기록이 생긴 지 30일이 지나면 지운다. identityHash는 계정을
   지울 때만 채우므로 값이 있는 행이 곧 탈퇴한 계정의 기록이다. 살아 있는 계정의 기록은
   지우지 않는다. */
export async function GET(request: Request): Promise<Response> {
	const authorization: string | null = request.headers.get("Authorization");

	if (!CRON_SECRET || !authorization || authorization !== `Bearer ${CRON_SECRET}`) {
		return Response.json({success: false}, {status: 401});
	}

	try {
		const result = await db.aiHistory.deleteMany({
			where: {
				identityHash: {
					not: null,
				},
				createdDt: {
					lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * KEEP_WITHDRAWN_HISTORY_DAYS),
				},
			},
		});

		return Response.json({success: true, deleted: result.count}, {status: 200});
	} catch (err) {
		console.error("탈퇴 계정 AI 기록 정리 실패", err);

		return Response.json({success: false}, {status: 500});
	}
}
