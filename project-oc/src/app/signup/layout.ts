import {Metadata} from "next";

export const metadata: Metadata = {
	title: "창작의 세계로... - 프로젝트 OC",
};

export default function SignupLayout({children}: LayoutProps<"/signup">) {
	return children;
}
