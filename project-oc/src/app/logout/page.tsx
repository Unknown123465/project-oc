"use client";

import { useEffect, useRef } from "react";
import logoutAction from "./action";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Logout() {
    const session = useSession();

    const router = useRouter();

    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (session.status === "authenticated") {
            const loop: number = window.setInterval(() => {
                if (formRef.current !== null) {
                    window.clearInterval(loop);

                    formRef.current.requestSubmit();
                }
            }, 10);
        } else if (session.status === "unauthenticated") {
            router.replace("/");
        }
    }, [session.status]);

    if (session.status === "authenticated") {
        return (
            <div>
                <h1>로그아웃 중입니다...</h1>

                <form action={logoutAction} hidden ref={formRef}></form>
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
