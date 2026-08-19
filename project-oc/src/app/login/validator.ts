import z from "zod";

export const loginForm = z.object({
	userName: z.string("값이 올바르지 않음").trim().min(1, "사용자 이름을 입력해 주세요."),
	password: z.string("값이 올바르지 않음").trim().min(1, "비밀번호를 입력해 주세요."),
});

export type LoginFormType = z.infer<typeof loginForm>;
