import ErrorScreen from "@/components/layout/error/ErrorScreen";
import {LinkButton} from "@/components/ui/button";

export default function Forbidden() {
	return (
		<ErrorScreen
			title="볼 수 없는 프로필입니다."
			description="이 프로필은 만든 사람만 볼 수 있어요. 내가 만든 프로필이라면 그 계정으로 다시 로그인해 주세요."
			visual="profileLocked"
			actions={
				<>
					<LinkButton href="/" width="auto" style={{padding: "0 22px"}} styleType="attention">
						홈으로
					</LinkButton>

					<LinkButton href="/create" width="auto" style={{padding: "0 22px"}} styleType="simple">
						프로필 만들기
					</LinkButton>
				</>
			}
		/>
	);
}
