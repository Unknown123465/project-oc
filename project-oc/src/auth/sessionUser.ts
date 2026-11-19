import {cache} from "react";
import db from "@/prisma/client";

/* 요청마다 세션 버전을 확인하려고 읽는 User 한 행. 기본 키로 한 행만 읽는다.

   autoplayMusic을 같이 읽는 이유는 프로필 페이지가 보는 사람의 자동 재생 설정을 따로
   조회하지 않게 하려는 것이다. 한 요청 안에서 auth()가 여러 번 불려도 React cache가
   같은 userId의 조회를 한 번으로 묶는다. cache는 서버 컴포넌트를 그리는 동안에만 묶고,
   라우트 핸들러에서는 매번 조회한다. */
export const getSessionUser = cache(async (userId: string) => {
	return await db.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			sessionVersion: true,
			autoplayMusic: true,
		},
	});
});
