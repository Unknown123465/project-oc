import ErrorScreen from "@/components/layout/error/ErrorScreen";
import {LinkButton} from "@/components/ui/button";

/* 로그인한 상태로 재설정 링크를 열었을 때. 로그인한 계정은 계정 설정에서 비밀번호를 바꾼다. */
export default function Forbidden() {
	return (
		<ErrorScreen
			title="접근이 거부되었어요."
			description="비밀번호 재설정은 로그아웃한 뒤에 할 수 있어요. 지금 계정의 비밀번호는 계정 설정에서 바꿔 주세요."
			visual="loggedIn"
			actions={
				<>
					<LinkButton href="/setting" width="auto" style={{padding: "0 22px"}} styleType="attention">
						계정 설정
					</LinkButton>

					<LinkButton href="/" width="auto" style={{padding: "0 22px"}} styleType="simple">
						홈으로
					</LinkButton>
				</>
			}
		/>
	);
}
