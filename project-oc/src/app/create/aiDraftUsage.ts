import db from "@/prisma/client";
import {AI_DRAFT_DAILY_LIMIT, type AiHistoryActionType} from "./validator";

/* 초기화 기준은 한국 시간 자정이다. 서버가 어느 지역에서 돌든 경계가 같아야 해서
   시스템 시간대를 쓰지 않고 고정 오프셋으로 계산한다. 한국은 서머타임이 없어
   +9가 연중 고정이라 이 단순한 방식이 성립한다. */
const KST_OFFSET_MILLIS: number = 9 * 60 * 60 * 1000;

/* 한국 시간 기준 "오늘". aiDraftUsedOn은 @db.Date라 시각을 버리고 날짜만 담으므로
   UTC 자정에 맞춘 Date를 넣어야 의도한 날짜가 그대로 저장된다. */
function getKstToday(): Date {
	const kstNow: Date = new Date(Date.now() + KST_OFFSET_MILLIS);

	return new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()));
}

/* 마지막으로 쓴 날이 오늘이 아니면 자정을 넘긴 것이라, 아직 한 번도 안 쓴 날로 본다.
   크론으로 0시에 전체를 밀지 않아도 되는 이유가 이 한 줄이다. */
function remainingFrom(usedOn: Date | null, usedCount: number): number {
	if (usedOn === null || usedOn.getTime() !== getKstToday().getTime()) {
		return AI_DRAFT_DAILY_LIMIT;
	}

	return Math.max(0, AI_DRAFT_DAILY_LIMIT - usedCount);
}

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

/* 한 번 쓸 권리를 확보한다. AI를 부르기 전에 먼저 차감하는 이유는, 호출이 오래 걸리는
   동안 같은 사용자가 다시 눌러 상한을 넘기는 걸 막기 위해서다. 실패하면 환불한다.

   읽고 나서 쓰면(findUnique → update) 동시에 들어온 두 요청이 같은 값을 읽어
   한 번 쓸 횟수로 두 번 쓸 수 있다. "상한 미만일 때만 1 올린다"를 한 문장으로 보내
   DB가 판정하게 하고, 실제로 바뀐 행 수로 성공 여부를 읽는다. */
export async function claimAiDraft(userId: string): Promise<{ok: boolean; remaining: number}> {
	const today: Date = getKstToday();

	const claimed: boolean = await db.$transaction(async (tx) => {
		/* 날짜가 바뀌었으면 오늘치로 되돌린다. where에 "오늘이 아님"을 넣어 두면 이미
		   오늘로 세고 있는 행은 건드리지 않아, 동시 요청이 서로의 사용량을 지우지 않는다.
		   aiDraftUsedOn이 null인 신규 사용자는 not 비교에 걸리지 않아 따로 적어 준다. */
		await tx.user.updateMany({
			where: {
				id: userId,
				OR: [{aiDraftUsedOn: null}, {aiDraftUsedOn: {not: today}}],
			},
			data: {aiDraftUsedOn: today, aiDraftUsedCount: 0},
		});

		const updated = await tx.user.updateMany({
			where: {
				id: userId,
				aiDraftUsedOn: today,
				aiDraftUsedCount: {lt: AI_DRAFT_DAILY_LIMIT},
			},
			data: {aiDraftUsedCount: {increment: 1}},
		});

		if (updated.count === 0) {
			return false;
		}

		await tx.aiHistory.create({data: {userId, action: "use"}});

		return true;
	});

	return {ok: claimed, remaining: await getAiDraftRemaining(userId)};
}

/* 결과를 못 준 요청의 횟수를 돌려준다. action에 왜 돌려줬는지가 남아 나중에
   "왜 내 횟수가 줄었냐"는 문의에 답할 수 있다.

   돌려주는 값이 number | undefined인 건 실패를 구분하기 위해서다. 환불이 깨졌는데
   예외를 올리면 원래의 실패 사유가 묻히고 Next.js 기본 오류 화면이 뜬다. 사용자에게
   보여 줄 응답은 이미 정해져 있으므로 여기서는 로그만 남기고 삼킨다. */
export async function refundAiDraft(userId: string, action: AiHistoryActionType): Promise<number | undefined> {
	const today: Date = getKstToday();

	try {
		return await db.$transaction(async (tx) => {
			/* 자정을 넘겨 이미 초기화된 뒤라면 돌려줄 것이 없다. 그때 감산하면
			   내일 몫을 하나 더 주게 된다. */
			await tx.user.updateMany({
				where: {id: userId, aiDraftUsedOn: today, aiDraftUsedCount: {gt: 0}},
				data: {aiDraftUsedCount: {decrement: 1}},
			});

			await tx.aiHistory.create({data: {userId, action}});

			const user = await tx.user.findUnique({
				where: {id: userId},
				select: {aiDraftUsedOn: true, aiDraftUsedCount: true},
			});

			return user === null ? AI_DRAFT_DAILY_LIMIT : remainingFrom(user.aiDraftUsedOn, user.aiDraftUsedCount);
		});
	} catch (err) {
		console.error("[refundAiDraft] 환불 실패", userId, action, err);

		return undefined;
	}
}
