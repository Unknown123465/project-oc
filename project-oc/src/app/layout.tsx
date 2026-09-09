import type {Metadata} from "next";
import {headers} from "next/headers";
import "./globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import localFont from "next/font/local";
import {InlineScript} from "@/components/InlineScript";
import Header from "@/components/layout/header/Header";
import Footer from "@/components/layout/footer/Footer";
import {SessionProvider} from "next-auth/react";

const pretendard = localFont({
	src: "./fonts/PretendardStdVariable.woff2",
	display: "swap",
	weight: "45 920",
});

export const metadata: Metadata = {
	title: "프로젝트 OC",
	description: "디자인을 몰라도 괜찮아요. 빈칸만 채우면 완성되는 자작 캐릭터 프로필 메이커.",
	/* 캐릭터 프로필처럼 페이지별 og:image가 상대 경로(예: /favicon.svg)를 쓰는 순간
	   이 값이 없으면 빌드 자체가 실패한다(Next 문서 명시). 배포 주소가 아직 없어
	   개발 기준값으로 두고, 실제 배포 시 NEXT_PUBLIC_SITE_URL로 교체한다. */
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default async function RootLayout({children}: LayoutProps<"/">) {
	/* CSP에 nonce가 들어 있으면 브라우저는 unsafe-inline을 무시한다. proxy가 만들어
	   x-nonce로 넘겨준 값을 여기서 붙이지 않으면 아래 테마 스크립트가 통째로 차단돼
	   첫 화면이 항상 기본 테마로 한 번 번쩍인다. */
	const nonce: string | null = (await headers()).get("x-nonce");

	return (
		<html lang="ko" className={pretendard.className} suppressHydrationWarning>
			<head>
				<InlineScript
					nonce={nonce ?? undefined}
					html={`(function(){
					try {
						const value = localStorage.getItem("color-theme");
						if(value === "dark" || value === "light") {
							document.documentElement.dataset.theme = value;
						}
					} catch (e) {}
					})()`}
				/>
			</head>

			<body>
				<SessionProvider>
					<Header />
					{children}
					<Footer />
				</SessionProvider>
			</body>
		</html>
	);
}
