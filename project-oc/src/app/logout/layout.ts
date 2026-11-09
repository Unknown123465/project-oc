import {Metadata} from "next";

export const metadata: Metadata = {
	title: "로그아웃 중이에요... - 프로젝트 OC",
	robots: "noindex",
};

export default function LogoutLayout({children}: LayoutProps<"/logout">) {
	return children;
}
