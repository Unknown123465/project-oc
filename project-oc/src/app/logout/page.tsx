"use client";

import {useEffect} from "react";
import {signOut, useSession} from "next-auth/react";
import {useRouter} from "next/navigation";

export default function Logout() {
	const session = useSession();

	const router = useRouter();

	const logout = async () => {
		await signOut({
			redirectTo: "/",
		});
	};

	useEffect(() => {
		if (session.status === "authenticated") {
			logout();
		} else if (session.status === "unauthenticated") {
			router.replace("/");
		}
	}, [session.status]);

	if (session.status === "authenticated") {
		return (
			<div>
				<h1>로그아웃 중입니다...</h1>
			</div>
		);
	} else if (session.status === "loading") {
		return (
			<div>
				<h1>로그인 여부를 확인중입니다...</h1>
			</div>
		);
	} else {
		return <div></div>;
	}
}
