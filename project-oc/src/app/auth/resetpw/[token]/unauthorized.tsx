import ErrorScreen from "@/components/layout/error/ErrorScreen";
import {LinkButton} from "@/components/ui/button";

/* 이메일 변경 링크의 401 화면(/auth/[token]/unauthorized.tsx)과 같은 모양이다. 다시 요청할 곳만 다르다. */
export default function Unauthorized() {
	return (
		<ErrorScreen
			title="쓸 수 없는 링크예요."
			description="링크를 쓸 수 있는 시간이 지났거나 이미 쓴 링크예요. 비밀번호 재설정을 다시 요청해 주세요."
			visual="linkExpired"
			actions={
				<>
					<LinkButton href="/resetpw" width="auto" style={{padding: "0 22px"}} styleType="attention">
						다시 요청하기
					</LinkButton>

					<LinkButton href="/" width="auto" style={{padding: "0 22px"}} styleType="simple">
						홈으로
					</LinkButton>
				</>
			}
		/>
	);
}
