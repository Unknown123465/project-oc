import ErrorScreen from "@/components/layout/error/ErrorScreen";
import {LinkButton} from "@/components/ui/button";

export default function NotFound() {
	return (
		<ErrorScreen
			title="찾고 계신 프로필이 없습니다."
			description="캐릭터가 삭제되었거나 주소가 잘못되었을 수 있어요."
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
