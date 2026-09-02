import z from "zod";

export const loginForm = z.object({
	userName: z.string("값이 올바르지 않음").trim().min(1, "사용자 이름을 입력해 주세요."),
	/* 비밀번호는 trim하지 않는다. 회원가입은 입력 그대로 해싱하므로
	   여기서만 앞뒤 공백을 지우면 그 공백을 포함해 가입한 사용자가
	   영영 로그인하지 못한다. */
	password: z.string("값이 올바르지 않음").min(1, "비밀번호를 입력해 주세요."),
});

export type LoginFormType = z.infer<typeof loginForm>;
