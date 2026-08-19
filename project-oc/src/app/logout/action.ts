"use server";

import {signOut} from "../../auth/auth";

export default async function logoutAction() {
	await signOut({
		redirectTo: "/",
	});

	return undefined;
}
