"use client";

import ErrorScreen from "@/components/layout/error/ErrorScreen";
import {ActionButton, LinkButton} from "@/components/ui/button";
import {ErrorInfo} from "next/error";

export default function ErrorPage({retry}: ErrorInfo) {
	return (
		<>
			<meta name="robots" content="noindex, noai, noimageai" />
			<title>문제가 생겼어요 - 프로젝트 OC</title>

			<ErrorScreen
				title="잠시 문제가 생겼어요."
				description="페이지를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
				visual="server"
				actions={
					<>
						<ActionButton width="auto" style={{padding: "0 22px"}} styleType="attention" onClick={retry}>
							다시 시도
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
