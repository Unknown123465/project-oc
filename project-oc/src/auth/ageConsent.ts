import "server-only";
import {cookies} from "next/headers";

/* 만 15세 미만은 가입을 막는다. 법(개인정보 보호법 제22조의2)이 요구하는 선은 만 14세이고, 15세는 허용하는 그림 수위에 맞춘 운영 기준이다.
   일반 가입은 폼의 체크로 확인하고, 소셜 가입은 가입 폼 없이 콜백에서 바로 계정이 생기므로
   로그인 화면에서 체크한 값을 이 쿠키로 콜백까지 넘긴다. */
const AGE_CONSENT_COOKIE: string = "age_consent";

/* 소셜 로그인 콜백(/api/auth/callback/...) 요청에만 실려 가도록 경로를 좁힌다. */
const AGE_CONSENT_PATH: string = "/api/auth";

/* 소셜 로그인 화면을 오가는 동안만 살아 있으면 된다. */
const AGE_CONSENT_MAX_AGE: number = 600;

/** 체크했으면 쿠키를 굽고, 체크를 풀었으면 남아 있던 쿠키를 지운다. */
export async function saveAgeConsent(confirmed: boolean): Promise<void> {
	const cookieStore = await cookies();

	if (confirmed) {
		cookieStore.set(AGE_CONSENT_COOKIE, "1", {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			path: AGE_CONSENT_PATH,
			maxAge: AGE_CONSENT_MAX_AGE,
		});
	} else {
		cookieStore.delete({name: AGE_CONSENT_COOKIE, path: AGE_CONSENT_PATH});
	}
}

/** 로그인 화면에서 만 15세 이상이라고 체크하고 넘어왔는지 */
export async function hasAgeConsent(): Promise<boolean> {
	const cookieStore = await cookies();

	return cookieStore.get(AGE_CONSENT_COOKIE)?.value === "1";
}

/** 가입이 끝났으면 다음 로그인에 남지 않게 지운다. */
export async function clearAgeConsent(): Promise<void> {
	const cookieStore = await cookies();

	cookieStore.delete({name: AGE_CONSENT_COOKIE, path: AGE_CONSENT_PATH});
}
