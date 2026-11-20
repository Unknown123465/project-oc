import type {Metadata} from "next";

export const metadata: Metadata = {
	title: "비밀번호 재설정 - 프로젝트 OC",
	robots: "noindex",
};

export default function ResetPasswordLayout({children}: LayoutProps<"/resetpw">) {
	return children;
}
