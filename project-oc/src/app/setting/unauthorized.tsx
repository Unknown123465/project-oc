import ErrorScreen from "@/components/layout/error/ErrorScreen";
import {LinkButton} from "@/components/ui/button";
import {LoginRedirectButton} from "@/app/_components/template/LoginRedirectButton";

export default function Unauthorized() {
	return (
		<ErrorScreen
			title="로그인이 필요해요."
			description="계정 설정을 보려면 로그인해 주세요."
			visual="profileLogin"
			actions={
				<>
					{/* 로그인 뒤 /setting으로 돌아오는 link 값은 아직 로그인 검증이 받지 않아서 넘기지 않는다. */}
					<LoginRedirectButton />

					<LinkButton href="/" width="auto" style={{padding: "0 22px"}} styleType="simple">
						홈으로
					</LinkButton>
				</>
			}
		/>
	);
}
