"use client";

import ErrorScreen from "@/components/layout/error/ErrorScreen";
import {ActionButton, LinkButton} from "@/components/ui/button";
import {ErrorInfo} from "next/error";

export default function ProfileErrorPage({retry}: ErrorInfo) {
	return (
		<>
			<meta name="robots" content="noindex, noai, noimageai" />
			<title>잠시 문제가 생겼습니다. 죄송합니다! - 프로젝트 OC</title>

			<ErrorScreen
				title="프로필을 불러오지 못했습니다."
				description="캐릭터 프로필과 카드를 잠시 사용할 수 없습니다. 잠시 후 다시 시도해 주세요."
				visual="profileServer"
				actions={
					<>
						<ActionButton width="auto" style={{padding: "0 22px"}} styleType="attention" onClick={retry}>
							다시 불러오기
						</ActionButton>

						<LinkButton href="/" width="auto" style={{padding: "0 22px"}} styleType="simple">
							홈으로
						</LinkButton>
					</>
				}
			/>
		</>
	);
}
