import db from "@/prisma/client";
/* 날짜 경계와 남은 횟수 계산은 DB를 타지 않는 순수 규칙이라 validator.ts에 둔다.
   여기는 그 규칙을 DB에 적용하는 자리다. */
import {AI_DRAFT_DAILY_CALL_LIMIT, AI_DRAFT_DAILY_LIMIT, AI_DRAFT_MIN_CALL_INTERVAL_SECONDS, type AiHistoryRefundReasonType, getKstToday, remainingFrom} from "./validator";

/** 오늘 남은 AI 초안 횟수. 로그인하지 않았거나 사용자를 못 찾으면 0으로 본다. */
export async function getAiDraftRemaining(userId?: string): Promise<number> {
	if (!userId) {
		return 0;
	}

	const user = await db.user.findUnique({
		where: {id: userId},
		/* 필요한 두 칸만 읽는다. select 없이 부르면 password 해시까지 메모리로 올라온다. */
		select: {aiDraftUsedOn: true, aiDraftUsedCount: true},
	});

	if (user === null) {
		return 0;
	}

	return remainingFrom(user.aiDraftUsedOn, user.aiDraftUsedCount);
}

/** 왜 확보하지 못했는지. 사용자에게 보여 줄 문구가 각각 다르다. */
export type ClaimRejection = "unknown-user" | "exhausted" | "call-limit" | "too-fast";

export type ClaimResult = {ok: true; remaining: number} | {ok: false; reason: ClaimRejection; remaining: number};

/* 한 번 쓸 권리를 확보한다. AI를 부르기 전에 먼저 차감하는 이유는, 호출이 오래 걸리는
   동안 같은 사용자가 다시 눌러 상한을 넘기는 걸 막기 위해서다. 실패하면 환불한다.

   읽고 나서 쓰면(findUnique → update) 동시에 들어온 두 요청이 같은 값을 읽어 한 번 쓸
   횟수로 두 번 쓸 수 있다. 세 관문을 모두 where에 넣어 한 문장으로 보내고, 실제로 바뀐
   행 수로 성공 여부를 읽는다 — 판정과 기록 사이에 틈이 없어야 동시 요청이 통과하지 못한다.

   어느 관문에 걸렸는지는 실패했을 때만 따로 읽는다. 성공 경로에 조회를 하나 더 붙이지
   않으려는 것이고, 실패는 드물어 한 번 더 읽어도 괜찮다. */
export async function claimAiDraft(userId: string): Promise<ClaimResult> {
	const today: Date = getKstToday();
	const now: Date = new Date();
	const callableAfter: Date = new Date(now.getTime() - AI_DRAFT_MIN_CALL_INTERVAL_SECONDS * 1000);

	const claimed: boolean = await db.$transaction(async (tx) => {
		/* 날짜가 바뀌었으면 오늘치로 되돌린다. where에 "오늘이 아님"을 넣어 두면 이미
		   오늘로 세고 있는 행은 건드리지 않아, 동시 요청이 서로의 사용량을 지우지 않는다.
		   aiDraftUsedOn이 null인 신규 사용자는 not 비교에 걸리지 않아 따로 적어 준다.
		   호출 수도 같이 초기화한다 — 두 값의 기준일이 같아야 한다. */
		await tx.user.updateMany({
			where: {
				id: userId,
				OR: [{aiDraftUsedOn: null}, {aiDraftUsedOn: {not: today}}],
			},
			data: {aiDraftUsedOn: today, aiDraftUsedCount: 0, aiDraftCallCount: 0},
		});

		const updated = await tx.user.updateMany({
			where: {
				id: userId,
				aiDraftUsedOn: today,
				/* 화면에 보이는 한도. 실패하면 환불되어 다시 올라간다. */
				aiDraftUsedCount: {lt: AI_DRAFT_DAILY_LIMIT},
				/* 실제 호출 상한. 환불해도 줄지 않아 차감-환불 반복을 끊는다. */
				aiDraftCallCount: {lte: AI_DRAFT_DAILY_CALL_LIMIT},
				/* 직전 호출과의 간격. null이면 오늘 처음이라 그냥 통과시킨다. */
				OR: [{aiDraftLastCallAt: null}, {aiDraftLastCallAt: {lte: callableAfter}}],
			},
			data: {
				aiDraftUsedCount: {increment: 1},
				aiDraftCallCount: {increment: 1},
				aiDraftLastCallAt: now,
			},
		});

		if (updated.count === 0) {
			return false;
		}

		await tx.aiHistory.create({data: {userId, action: "use"}});

		return true;
	});

	if (claimed) {
		return {ok: true, remaining: await getAiDraftRemaining(userId)};
	}

	return {ok: false, ...(await diagnoseClaimFailure(userId, callableAfter))};
}

/* 확보에 실패한 뒤 원인을 가린다. 위 updateMany의 where를 그대로 되짚는 순서라,
   관문을 고칠 때 여기도 같이 고쳐야 한다. */
async function diagnoseClaimFailure(userId: string, callableAfter: Date): Promise<{reason: ClaimRejection; remaining: number}> {
	const user = await db.user.findUnique({
		where: {id: userId},
		select: {aiDraftUsedOn: true, aiDraftUsedCount: true, aiDraftCallCount: true, aiDraftLastCallAt: true},
	});

	/* 세션은 JWT라 사용자가 지워져도 토큰은 한동안 유효하다. 그 경우를 "다 썼다"로
	   보여 주면 내일 다시 오라는 안내가 영영 맞지 않는다. */
	if (user === null) {
		return {reason: "unknown-user", remaining: 0};
	}

	const remaining: number = remainingFrom(user.aiDraftUsedOn, user.aiDraftUsedCount);

	if (user.aiDraftCallCount >= AI_DRAFT_DAILY_CALL_LIMIT) {
		return {reason: "call-limit", remaining: 0};
	}

	if (user.aiDraftLastCallAt !== null && user.aiDraftLastCallAt > callableAfter) {
		return {reason: "too-fast", remaining};
	}

	/* 위 둘이 아니면 남은 횟수를 다 쓴 것이다. 진단을 읽는 사이에 다른 요청이 마지막
	   한 번을 가져갔을 수도 있는데, 그때도 사용자에게는 같은 안내가 맞다. */
	return {reason: "exhausted", remaining};
}

/* 결과를 못 준 요청의 횟수를 돌려준다. reason에 왜 돌려줬는지가 남아 나중에
   "왜 내 횟수가 줄었냐"는 문의에 답할 수 있다. action은 항상 "refund"로 고정 —
   "무엇을 했나"와 "왜 했나"를 컬럼으로 나눴으니 여기서 둘을 합칠 필요가 없다.

   돌려주는 값이 number | undefined인 건 실패를 구분하기 위해서다. 환불이 깨졌는데
   예외를 올리면 원래의 실패 사유가 묻히고 Next.js 기본 오류 화면이 뜬다. 사용자에게
   보여 줄 응답은 이미 정해져 있으므로 여기서는 로그만 남기고 삼킨다. */
export async function refundAiDraft(userId: string, reason: AiHistoryRefundReasonType): Promise<number | undefined> {
	const today: Date = getKstToday();

	try {
		return await db.$transaction(async (tx) => {
			/* 자정을 넘겨 이미 초기화된 뒤라면 돌려줄 것이 없다. 그때 감산하면
			   내일 몫을 하나 더 주게 된다. */
			await tx.user.updateMany({
				where: {id: userId, aiDraftUsedOn: today, aiDraftUsedCount: {gt: 0}},
				data: {aiDraftUsedCount: {decrement: 1}},
			});

			await tx.aiHistory.create({data: {userId, action: "refund", reason}});

			const user = await tx.user.findUnique({
				where: {id: userId},
				select: {aiDraftUsedOn: true, aiDraftUsedCount: true},
			});

			return user === null ? AI_DRAFT_DAILY_LIMIT : remainingFrom(user.aiDraftUsedOn, user.aiDraftUsedCount);
		});
	} catch (err) {
		console.error("[refundAiDraft] 환불 실패", userId, reason, err);

		return undefined;
	}
}
