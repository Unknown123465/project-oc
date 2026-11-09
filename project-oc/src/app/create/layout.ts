import {Metadata} from "next";

export const metadata: Metadata = {
	title: "프로필 제작 - 프로젝트 OC",
};

export default function CreateLayout({children}: LayoutProps<"/create">) {
	return children;
}
