"use client";

import {useEffect} from "react";

/* Next.js App Router에는 react-router의 useBlocker 같은 차단 훅이 없어
   (node_modules/next/dist/docs 확인 완료) history API를 직접 다루는 두 장치를
   함께 쓴다. 이 둘이 막는 범위가 서로 다르고 겹치지 않는다 - 하나만 쓰면 구멍이 남는다.

   ① popstate 재push - 문서를 그대로 두고 같은 문서 안에서 "뒤로" 한 칸만
      움직이려는 시도(Next.js가 popstate를 가로채 클라이언트 사이드로 전환하는
      경우 포함)를 막는다. 열릴 때 같은 URL로 더미 엔트리를 하나 쌓고, popstate가
      오면 같은 자리에 다시 쌓는다. "앞으로"는 pushState가 항상 forward 스택을
      비우므로 이 동작만으로 이미 막힌다.

      한계: 이건 정공법이 아니라 브라우저가 남에게 악용당해 온 패턴(뒤로가기를
      못 나가게 가두는 스캠 사이트)과 신호가 똑같다. 그래서 브라우저마다 이런
      반복 push를 감지하면 다음 "뒤로가기"에서 여러 칸을 한 번에 건너뛰게
      해주는 등 우회 대응이 있고, 길게 눌러 히스토리 목록에서 임의 항목으로
      바로 이동하는 경우도 이 재push로는 못 막는다 - 이 경우는 문서 자체가
      바뀌므로 아래 ②가 대신 막는다.

   ② beforeunload - 실제로 문서가 언로드되는 모든 경우(탭 닫기·새로고침·
      ①을 우회해 다른 문서로 넘어가는 뒤로/앞으로가기)에 브라우저 자체의
      "나가시겠습니까?" 대화상자를 띄운다. 이건 브라우저가 이 목적을 위해
      제공하는 정식 API라 ①과 달리 악용 방지 휴리스틱의 대상이 아니고, 우회할
      수 없다.

   그래도 100% 차단은 아니다 - 클라이언트 JS만으로 브라우저 뒤로/앞으로가기를
   완전히 막는 방법은 없다(사용자가 항상 항해 통제권을 갖도록 브라우저가
   의도적으로 설계한 것). react-router의 useBlocker도 같은 한계를 문서에
   명시하고 있다. */
export function useBlockNavigation(active: boolean) {
	useEffect(() => {
		if (!active) {
			return;
		}

		history.pushState(null, "", location.href);

		const handlePopState = () => {
			history.pushState(null, "", location.href);
		};

		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
		};

		window.addEventListener("popstate", handlePopState);
		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("popstate", handlePopState);
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [active]);
}
