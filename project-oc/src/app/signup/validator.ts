import z from "zod";

export const USER_NAME_MIN_LENGTH = 2;
export const USER_NAME_MAX_LENGTH = 20;

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 20;

export const signupForm = z
	.object({
		email: z.string("값이 올바르지 않음").trim().min(1, "이메일 주소를 입력해 주세요.").pipe(z.email("이메일 주소 형식이 올바르지 않습니다.")),
		userName: z
			.string("값이 올바르지 않음")
			.trim()
			.min(USER_NAME_MIN_LENGTH, `사용자 이름은 ${USER_NAME_MIN_LENGTH}자 이상이어야 합니다.`)
			.max(USER_NAME_MAX_LENGTH, `사용자 이름은 ${USER_NAME_MAX_LENGTH}자 이하여야 합니다.`),
		/* 비밀번호는 trim하지 않는다. 앞뒤 공백을 조용히 지우면
		   사용자가 입력한 것과 저장되는 것이 달라진다. */
		password: z
			.string("값이 올바르지 않음")
			.min(PASSWORD_MIN_LENGTH, `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`)
			.max(PASSWORD_MAX_LENGTH, `비밀번호는 ${PASSWORD_MAX_LENGTH}자 이하여야 합니다.`)
			.regex(/[A-Za-z]/, "비밀번호에 영문을 포함해 주세요.")
			.regex(/[0-9]/, "비밀번호에 숫자를 포함해 주세요."),
		passwordRepeat: z.string("값이 올바르지 않음").min(1, "비밀번호 확인을 입력해 주세요."),
	})
	.refine((data) => data.password === data.passwordRepeat, {
		message: "비밀번호가 일치하지 않습니다.",
		path: ["passwordRepeat"],
	});

export type SignupFormType = z.infer<typeof signupForm>;
