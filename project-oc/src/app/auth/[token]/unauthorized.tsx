import ErrorScreen from "@/components/layout/error/ErrorScreen";
import {LinkButton} from "@/components/ui/button";

export default function Unauthorized() {
	return (
		<ErrorScreen
			title="쓸 수 없는 링크예요."
			description="링크를 쓸 수 있는 시간이 지났거나 이미 쓴 링크예요. 계정 설정에서 이메일 변경을 다시 요청해 주세요."
			visual="linkExpired"
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
