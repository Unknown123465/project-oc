import "server-only";
import {randomBytes} from "node:crypto";
import db from "@/prisma/client";
import {USER_NAME_MAX_LENGTH} from "@/app/signup/validator";

/** 중복일 때 붙이는 임의 문자 길이. 접미사까지 합쳐도 회원가입 규칙과 같은
 *  최대 길이를 넘지 않도록 뒤에서 잘라 낸다. */
const SUFFIX_LENGTH: number = 4;
const SUFFIX_SEPARATOR: string = "_";
const MAX_ATTEMPTS: number = 5;

const FALLBACK_BASE: string = "user";

function randomSuffix(): string {
	/* toString("hex")는 바이트당 두 글자를 만드므로 절반만 뽑아 자른다. */
	return randomBytes(Math.ceil(SUFFIX_LENGTH / 2))
		.toString("hex")
		.slice(0, SUFFIX_LENGTH);
}

async function isTaken(userName: string): Promise<boolean> {
	const owner = await db.user.findUnique({
		where: {
			username: userName,
		},
		select: {
			id: true,
		},
	});

	return owner !== null;
}

/**
 * 소셜 가입자의 name을 그대로 username으로 쓰되, 이미 쓰이고 있으면
 * 뒤에 임의 문자를 붙여 비어 있는 값을 찾는다.
 *
 * 확인과 저장 사이에 다른 가입이 끼어들 수 있으므로 이 함수만으로는
 * 유일성이 보장되지 않는다. 최종 방어선은 username 컬럼의 UNIQUE 제약이다.
 */
export async function resolveUniqueUserName(name: string | null | undefined): Promise<string> {
	const base: string = typeof name === "string" && name.trim() ? name.trim().slice(0, USER_NAME_MAX_LENGTH) || FALLBACK_BASE : FALLBACK_BASE;

	if (!(await isTaken(base))) {
		return base;
	}

	const shortBase: string = base.slice(0, USER_NAME_MAX_LENGTH - SUFFIX_LENGTH - SUFFIX_SEPARATOR.length);

	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		const candidate: string = `${shortBase}${SUFFIX_SEPARATOR}${randomSuffix()}`;

		if (!(await isTaken(candidate))) {
			return candidate;
		}
	}

	/* 여기까지 왔으면 UNIQUE 제약에 맡긴다. 실패하면 로그인이 실패하는 편이
	   엉뚱한 사용자 이름을 조용히 붙이는 것보다 낫다. */
	return `${shortBase}${SUFFIX_SEPARATOR}${randomSuffix()}`;
}
