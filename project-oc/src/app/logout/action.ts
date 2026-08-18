"use server";

import { signOut } from "../api/auth/auth";

export default async function logoutAction() {
    await signOut({
        redirectTo: "/",
    });

    return undefined;
}
