import ErrorScreen from "@/components/layout/error/ErrorScreen";
import {LinkButton} from "@/components/ui/button";
import {Metadata} from "next";

export const metadata: Metadata = {
	title: "여기가 어디예요? - 프로젝트 OC",
	robots: "noindex, noai, noimageai",
};

export default function NotFound() {
	return (
		<>
			<ErrorScreen
				title="이런, 페이지를 찾을 수 없어요."
				description="주소가 잘못 입력되었거나 페이지가 이동했을 수 있어요. 홈으로 돌아가거나 새 프로필을 만들어 보세요."
				visual="page"
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
		</>
	);
}
