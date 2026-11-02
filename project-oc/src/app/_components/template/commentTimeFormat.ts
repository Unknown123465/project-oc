const TIME_DIFF_NUMBER = {
	least1minute: 60,
	least60minute: 60 * 60,
	least1day: 60 * 60 * 24,
	least7day: 60 * 60 * 24 * 7,
} as const;

/* 코멘트 작성 시각을 "방금 전", "n분 전" 같은 문구로 바꾼다. 지금 시각과 시간대를 인자로 받는 순수 함수라
   서버 렌더와 hydration(렌더 시각 + 서울)과 그 뒤 브라우저(현재 시각 + 기기 시간대)에서 같이 쓰고, fn 테스트로 확인한다. */
export function toCommentTimeFormat(createdAt: Date, now: number, timeZone: string): string {
	const createdTime: number = createdAt.getTime();

	const timeDiff: number = Math.floor((now - createdTime) / 1000);

	const dateFormat: Intl.DateTimeFormat = Intl.DateTimeFormat("ko", {timeZone, year: "numeric", month: "2-digit", day: "2-digit"});

	const nowYear: string | undefined = dateFormat.formatToParts(now).find((part) => part.type === "year")?.value;
	const [createdYear, createdMonth, createdDay] = dateFormat
		.formatToParts(createdTime)
		.filter((part) => part.type === "year" || part.type === "month" || part.type === "day")
		.map((part) => part.value);

	const isYearDifferent: boolean = nowYear !== createdYear;

	if (timeDiff < TIME_DIFF_NUMBER.least1minute) {
		return "방금 전";
	} else if (timeDiff < TIME_DIFF_NUMBER.least60minute) {
		const minuteDiff: number = Math.floor(timeDiff / TIME_DIFF_NUMBER.least1minute);

		return minuteDiff + "분 전";
	} else if (timeDiff < TIME_DIFF_NUMBER.least1day) {
		const hourDiff: number = Math.floor(timeDiff / TIME_DIFF_NUMBER.least60minute);

		return hourDiff + "시간 전";
	} else if (timeDiff < TIME_DIFF_NUMBER.least7day) {
		const dayDiff: number = Math.floor(timeDiff / TIME_DIFF_NUMBER.least1day);

		return dayDiff + "일 전";
	} else if (!isYearDifferent) {
		return createdMonth + "-" + createdDay;
	} else {
		return createdYear + "-" + createdMonth + "-" + createdDay;
	}
}
