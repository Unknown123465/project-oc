import {Metadata} from "next";

export const metadata: Metadata = {
	title: "로그인 - 프로젝트 OC",
	robots: "noindex",
};

export default function LoginLayout({children}: LayoutProps<"/login">) {
	return children;
}
