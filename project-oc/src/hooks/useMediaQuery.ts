import {useCallback, useSyncExternalStore} from "react";

/* 서버에는 뷰포트가 없다. false로 그려 두면 하이드레이션 직후 실제 폭으로 정정된다. */
function getServerSnapshot(): boolean {
	return false;
}

/* 뷰포트 폭은 React 밖에 있는 브라우저 상태라 useSyncExternalStore로 구독한다.
   effect 안에서 setState로 맞추면 첫 렌더가 한 번 버려지고, 저장소 lint 규칙
   react-hooks/set-state-in-effect에도 걸린다. */
export function useMediaQuery(query: string): boolean {
	const subscribe = useCallback(
		(onStoreChange: () => void) => {
			const mediaQuery: MediaQueryList = window.matchMedia(query);

			mediaQuery.addEventListener("change", onStoreChange);

			return () => {
				mediaQuery.removeEventListener("change", onStoreChange);
			};
		},
		[query],
	);

	const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
