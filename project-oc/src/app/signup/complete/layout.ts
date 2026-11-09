import {Metadata} from "next";

export const metadata: Metadata = {
	title: "가입 완료를 축하해요! - 프로젝트 OC",
	robots: "noindex",
};

export default function SignupCompleteLayout({children}: LayoutProps<"/signup/complete">) {
	return children;
}
