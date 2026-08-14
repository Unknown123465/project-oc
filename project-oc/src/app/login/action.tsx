"use server";

import {redirect} from "next/navigation";

export default async function loginAction(prevState: string | null, formData: FormData) {
	const userName = formData.get("userName");
	const password = formData.get("password");

	if (typeof userName !== "string" || !userName.trim()) {
		return "사용자 이름을 입력해주세요";
	} else if (typeof password !== "string" || !password.trim()) {
		return "비밀번호를 입력해주세요";
	}

	const test: number = Math.random();

	await new Promise((res) => setTimeout(res, 1000));

	if (test < 1) {
		redirect("/", "replace");
	} else {
		return Math.random().toString();
	}
}
