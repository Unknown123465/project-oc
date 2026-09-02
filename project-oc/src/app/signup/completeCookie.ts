import "server-only";

/** 방금 가입을 마쳤다는 표시. 완료 페이지는 이 쿠키가 있어야 열린다.
 *  가입 액션만 심을 수 있도록 httpOnly로 굽는다. */
export const SIGNUP_COMPLETE_COOKIE: string = "signup_complete";

/** 완료 페이지 요청에만 실려 가도록 경로를 좁힌다. */
export const SIGNUP_COMPLETE_PATH: string = "/signup/complete";

/** 가입 직후 곧바로 이동하는 경로라 짧게 잡는다. 이 시간이 지나면 완료 페이지는 닫힌다. */
export const SIGNUP_COMPLETE_MAX_AGE: number = 300;
