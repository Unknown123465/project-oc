import {Metadata} from "next";

export const metadata: Metadata = {
	title: "회원가입 - 프로젝트 OC",
};

export default function SignupLayout({children}: LayoutProps<"/signup">) {
	return children;
}
