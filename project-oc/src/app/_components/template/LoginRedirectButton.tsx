"use client";

import {LinkButton} from "@/components/ui/button";
import {useParams, useSearchParams} from "next/navigation";

interface LoginRedirectButtonProps {
	/** 로그인 뒤 돌아갈 페이지. 로그인 페이지의 link 쿼리로 그대로 넘어간다. */
	link?: "template" | "edit" | "mylist";
	acceptAllQueries?: boolean;
}

export function LoginRedirectButton({link = "template", acceptAllQueries = false}: LoginRedirectButtonProps) {
	const {uuid} = useParams();
	const query = useSearchParams();

	let href: string = "/login";

	if (acceptAllQueries) {
		const realQuery: URLSearchParams = new URLSearchParams(query);

		realQuery.set("link", link);

		href += "?" + realQuery.toString();
	} else if (uuid) {
		href += `?link=${link}&uuid=${uuid}`;
	}

	return (
		<LinkButton href={href} width="auto" style={{padding: "0 22px"}} styleType="attention">
			로그인
		</LinkButton>
	);
}
