/* 좋아요 수 표기. 컴포넌트 밖으로 뺀 이유는 테스트 때문이다 - ProfileLike.tsx는 CSS 모듈과
   서버 액션을 불러와 node 환경 테스트에서 import할 수 없다.

   반올림하면 실제보다 큰 수가 보인다(1,950 → 2k, 999,999 → 1m). 인기를 부풀려 보여 주지
   않으려고 버림으로 자른다. */
const likeFormat: Intl.NumberFormat = Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 1,
	roundingMode: "trunc",
});

export function applyLikeFormat(count: number): string {
	return likeFormat.format(count).toLowerCase();
}
