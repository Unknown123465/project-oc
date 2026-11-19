import type {Metadata} from "next";
import {unauthorized} from "next/navigation";
import {auth} from "@/auth/auth";
import {getEmailChangeRequest} from "@/auth/verificationToken";
import EmailConfirmScreen from "@/app/_components/auth/EmailConfirmScreen";

/* 주소에 토큰이 들어 있어서 검색에 노출하지 않고, 이 페이지에서 다른 곳으로 갈 때
   Referer로 토큰이 새지 않게 막는다. 쓸 수 있는 링크인지에 따라 탭 제목만 다르게 둔다. */
export async function generateMetadata({params}: PageProps<"/auth/[token]">): Promise<Metadata> {
	const {token} = await params;

	const request = await getEmailChangeRequest(token);

	return {
		title: request !== null ? "이메일 변경 확인 - 프로젝트 OC" : "쓸 수 없는 링크 - 프로젝트 OC",
		robots: "noindex",
		referrer: "no-referrer",
	};
}

/* 이메일 변경 메일의 링크로 들어오는 페이지. 열기만 해서는 아무것도 바뀌지 않고, 버튼을 눌러야 바뀐다.
   열자마자 쓸 수 없는 링크(만료, 이미 씀, 없는 토큰)면 401 화면을 보여 준다. 없는 주소용 404 화면은 따로 두지 않는다. */
export default async function AuthTokenPage({params}: PageProps<"/auth/[token]">) {
	const {token} = await params;

	const [request, authInfo] = await Promise.all([getEmailChangeRequest(token), auth()]);

	if (request === null) {
		unauthorized();
	}

	return <EmailConfirmScreen token={token} userName={request.userName} newEmail={request.newEmail} loggedIn={authInfo !== null} />;
}
