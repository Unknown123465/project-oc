"use server";

import { signIn, authProviders } from "../api/auth/auth";

export async function googleLoginAction() {
    const id = authProviders.Google;

    await signIn(id, {
        redirectTo: "/",
    });
}

export async function naverLoginAction() {
    const id = authProviders.Naver;

    await signIn(id, {
        redirectTo: "/",
    });
}

export async function kakaoLoginAction() {
    const id = authProviders.Kakao;

    await signIn(id, {
        redirectTo: "/",
    });
}

export async function twitterLoginAction() {
    const id = authProviders.Twitter;

    await signIn(id, {
        redirectTo: "/",
    });
}
