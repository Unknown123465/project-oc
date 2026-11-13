import {auth} from "@/auth/auth";
import type {Metadata} from "next";

/* 로그인한 사용자 본인만 보는 페이지라 검색에 노출하지 않는다. */
export async function generateMetadata(): Promise<Metadata> {
	const authInfo = await auth();

	const isLogouted: boolean = authInfo === null || !authInfo.user?.id;

	let title: string = isLogouted ? "로그인이 필요합니다" : "내 프로필";

	title += " - 프로젝트 OC";

	return {
		title,
		robots: "noindex",
	};
}

export default function MyListLayout({children}: LayoutProps<"/mylist">) {
	return children;
}
