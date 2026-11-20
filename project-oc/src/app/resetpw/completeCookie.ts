import "server-only";

/** 방금 비밀번호를 재설정했다는 표시. 완료 페이지는 이 쿠키가 있어야 열린다.
 *  재설정 액션만 심을 수 있도록 httpOnly로 굽는다. */
export const RESET_PASSWORD_COMPLETE_COOKIE = "reset_password_complete" as const;

/** 완료 페이지 요청에만 실려 가도록 경로를 좁힌다. */
export const RESET_PASSWORD_COMPLETE_PATH = "/resetpw/complete" as const;

/** 재설정 직후 곧바로 이동하는 경로라 짧게 잡는다. */
export const RESET_PASSWORD_COMPLETE_MAX_AGE = 300 as const;
