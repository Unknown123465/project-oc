import {isUuid} from "@/prisma/uuid";
import z, {type ZodSafeParseResult} from "zod";

export const loginForm = z.object({
	userName: z.string("값이 올바르지 않음").trim().min(1, "사용자 이름을 입력해 주세요."),
	/* 비밀번호는 trim하지 않는다. 회원가입은 입력 그대로 해싱하므로
	   여기서만 앞뒤 공백을 지우면 그 공백을 포함해 가입한 사용자가
	   영영 로그인하지 못한다. */
	password: z.string("값이 올바르지 않음").min(1, "비밀번호를 입력해 주세요."),
});

export type LoginFormType = z.infer<typeof loginForm>;

export const providerForm = z.enum(["Google", "Naver", "Kakao", "Twitter"], "공급업체가 올바르지 않아요. 다시 시도해 주세요.");

export type ProviderFormType = z.infer<typeof providerForm>;

export const LOGIN_QUERY_TYPE_IS_NOT_VALID = "요청이 올바르지 않아요. 다시 시도해 주세요." as const;

/* 같은 주소로 다시 시도해도 계속 거부되므로 "다시 시도"가 아니라 돌아갈 곳을 안내한다. */
export const LOGIN_QUERY_UUID_IS_NOT_VALID = "돌아갈 프로필 주소가 올바르지 않아요. 프로필 페이지에서 다시 로그인해 주세요." as const;

/* 서버 액션이 결과 대신 예외를 던졌을 때(네트워크 오류, 예상 못 한 서버 오류) 화면에 띄우는 문구.
   예외의 message는 사용자용이 아니고 프로덕션에서는 Next가 가린 문장으로 바뀌므로 그대로 쓰지 않는다.
   action.ts는 "use server" 파일이라 함수 말고는 export할 수 없어 클라이언트와 같이 쓰는 이 파일에 둔다. */
export const LOGIN_UNEXPECTED_ERROR_MESSAGE = "로그인 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." as const;

const loginQueryForm = z
	.object(
		{
			link: z.enum(["template"], "주소가 유효하지 않아요. 다시 시도해 주세요."),
			uuid: z.string(LOGIN_QUERY_UUID_IS_NOT_VALID).refine((value: string) => isUuid(value), LOGIN_QUERY_UUID_IS_NOT_VALID),
		},
		LOGIN_QUERY_TYPE_IS_NOT_VALID
	)
	.nullable();

type LoginQueryFormType = z.infer<typeof loginQueryForm>;

type LoginQueryCheck = ZodSafeParseResult<LoginQueryFormType>;

function isRootQueryFailed(check: LoginQueryCheck): boolean {
	return !check.success && check.error.issues.some(({path}) => path.length === 0);
}

function isLinkQueryFailed(check: LoginQueryCheck): boolean {
	return !check.success && check.error.issues.some(({path}) => path.includes("link"));
}

function genRedirectToUrl(query: NonNullable<LoginQueryFormType>): string {
	return `/${encodeURIComponent(query.link)}/${encodeURIComponent(query.uuid)}`;
}

/* 쿼리가 비어 있으면 undefined가 아니라 null을 돌려준다. loginQueryForm은
   null만 "돌아갈 곳 없음"으로 받고 undefined는 막는다. */
export function toLoginQuery(params: URLSearchParams): Record<string, string> | null {
	return params.size > 0 ? Object.fromEntries(params.entries()) : null;
}

interface LoginRedirectSuccessResult {
	success: true;
	result: string;
}

interface LoginRedirectFailureResult {
	success: false;
	message: string;
}

type LoginRedirectResult = LoginRedirectSuccessResult | LoginRedirectFailureResult;

/* 일반 로그인과 소셜 로그인이 같이 쓰는 "로그인 뒤 어디로 갈지" 판단.
   쿼리가 객체가 아니면 거부 → link가 허용 목록 밖이면 메인 → link는 맞는데 uuid가 틀리면 거부 순서다.
   link를 uuid보다 먼저 보는 이유는 /login?error=...처럼 link가 없는 쿼리에서 uuid 오류도 같이 나오기 때문이다. */
export function resolveLoginRedirect(query: unknown): LoginRedirectResult {
	const check = loginQueryForm.safeParse(query);

	if (check.success) {
		return {
			success: true,
			result: check.data === null ? "/" : genRedirectToUrl(check.data),
		};
	}

	const rootQueryFailed: boolean = isRootQueryFailed(check);

	if (rootQueryFailed) {
		return {
			success: false,
			message: check.error.issues[0].message,
		};
	}

	const linkQueryFailed: boolean = isLinkQueryFailed(check);

	if (linkQueryFailed) {
		return {
			success: true,
			result: "/",
		};
	} else {
		return {
			success: false,
			message: check.error.issues[0].message,
		};
	}
}
