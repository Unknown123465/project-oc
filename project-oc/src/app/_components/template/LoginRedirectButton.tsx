"use client";

import {LinkButton} from "@/components/ui/button";
import {useParams} from "next/navigation";

export function LoginRedirectButton() {
	const {uuid} = useParams();

	let href: string = "/login";

	href += uuid ? `?link=template&uuid=${uuid}` : "";

	return (
		<LinkButton href={href} width="auto" style={{padding: "0 22px"}} styleType="attention">
			로그인
		</LinkButton>
	);
}
