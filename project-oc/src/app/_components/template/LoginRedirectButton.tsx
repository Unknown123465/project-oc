"use client";

import {LinkButton} from "@/components/ui/button";
import {useParams} from "next/navigation";

interface LoginRedirectButtonProps {
	/** 로그인 뒤 돌아갈 페이지. 로그인 페이지의 link 쿼리로 그대로 넘어간다. */
	link?: "template" | "edit";
}

export function LoginRedirectButton({link = "template"}: LoginRedirectButtonProps) {
	const {uuid} = useParams();

	let href: string = "/login";

	href += uuid ? `?link=${link}&uuid=${uuid}` : "";

	return (
		<LinkButton href={href} width="auto" style={{padding: "0 22px"}} styleType="attention">
			로그인
		</LinkButton>
	);
}
