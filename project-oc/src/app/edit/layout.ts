import {Metadata} from "next";

export const metadata: Metadata = {
	title: "여기가 어디예요? - 프로젝트 OC",
	robots: "noindex",
};

export default function EditLayout({children}: LayoutProps<"/edit">) {
	return children;
}
