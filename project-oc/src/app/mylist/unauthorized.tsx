import ErrorScreen from "@/components/layout/error/ErrorScreen";
import {LinkButton} from "@/components/ui/button";
import {LoginRedirectButton} from "@/app/_components/template/LoginRedirectButton";

export default function Unauthorized() {
	return (
		<ErrorScreen
			title="로그인이 필요해요."
			description="내가 만든 캐릭터를 보려면 로그인해 주세요."
			visual="profileLogin"
			actions={
				<>
					<LoginRedirectButton link="mylist" acceptAllQueries />

					<LinkButton href="/" width="auto" style={{padding: "0 22px"}} styleType="simple">
						홈으로
					</LinkButton>
				</>
			}
		/>
	);
}
