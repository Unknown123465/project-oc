"use server";

import "server-only";
import db from "@/prisma/client";
import {signupForm, type SignupFormType} from "./validator";

export type SignupActionResult = {success: true} | {success: false; message: string};

export async function signupAction(data: SignupFormType): Promise<SignupActionResult> {
	/* 클라이언트에서 이미 같은 스키마로 걸렀지만 서버 액션은 직접 호출될 수 있다.
	   여기가 신뢰 경계이므로 다시 검사한다. */
	const check = signupForm.safeParse(data);

	if (!check.success) {
		return {success: false, message: check.error.issues[0].message};
	}

	const {email, userName} = check.data;

	const [emailOwner, userNameOwner] = await Promise.all([
		db.user.findUnique({where: {email}, select: {id: true}}),
		db.user.findUnique({where: {username: userName}, select: {id: true}}),
	]);

	if (emailOwner !== null) {
		return {success: false, message: "이미 가입된 이메일 주소입니다."};
	}

	if (userNameOwner !== null) {
		return {success: false, message: "이미 사용 중인 사용자 이름입니다."};
	}

	return {success: true};
}
