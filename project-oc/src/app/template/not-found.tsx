import ErrorScreen from "@/components/layout/error/ErrorScreen";
import {LinkButton} from "@/components/ui/button";

export default function NotFound() {
	return (
		<ErrorScreen
			title="프로필을 찾을 수 없어요."
			description="삭제됐거나 주소가 잘못됐을 수 있어요."
			visual="profileMissing"
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
