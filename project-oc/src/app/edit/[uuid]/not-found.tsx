import ErrorScreen from "@/components/layout/error/ErrorScreen";
import {LinkButton} from "@/components/ui/button";

/* 없는 프로필과 남의 프로필을 같은 화면으로 보여 준다. 문구를 나누면 프로필이 있는지를 알려 주게 된다. */
export default function NotFound() {
	return (
		<ErrorScreen
			title="수정할 캐릭터를 찾을 수 없어요."
			description="주소가 잘못됐거나, 삭제됐거나, 내가 만든 캐릭터가 아니에요."
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
