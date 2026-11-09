import ErrorScreen from "@/components/layout/error/ErrorScreen";
import {LinkButton} from "@/components/ui/button";
import {LoginRedirectButton} from "../_components/template/LoginRedirectButton";

export default function Unauthorized() {
	return (
		<ErrorScreen
			title="로그인이 필요한 프로필입니다."
			description="비공개 프로필은 만든 사람만 볼 수 있어요. 내가 만든 프로필이라면 로그인해 주세요."
			visual="profileLogin"
			actions={
				<>
					<LoginRedirectButton />

					<LinkButton href="/" width="auto" style={{padding: "0 22px"}} styleType="simple">
						홈으로
					</LinkButton>
				</>
			}
		/>
	);
}
