import z from "zod";

export const USER_NAME_MIN_LENGTH = 2;
export const USER_NAME_MAX_LENGTH = 20;

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 20;

/* 계정 설정의 이메일, 사용자 이름, 비밀번호 변경도 가입과 같은 규칙을 써야 해서 칸마다 따로 꺼내 둔다.
   특히 사용자 이름은 로그인할 때 입력하는 값이라 규칙이 갈리면 바꾼 이름으로 로그인하지 못할 수 있다. */
export const emailField = z.string("값이 올바르지 않아요.").trim().min(1, "이메일 주소를 입력해 주세요.").pipe(z.email("이메일 주소를 형식에 맞게 입력해 주세요."));

export const userNameField = z
	.string("값이 올바르지 않아요.")
	.trim()
	.min(USER_NAME_MIN_LENGTH, `사용자 이름은 ${USER_NAME_MIN_LENGTH}자 이상으로 입력해 주세요.`)
	.max(USER_NAME_MAX_LENGTH, `사용자 이름은 ${USER_NAME_MAX_LENGTH}자까지 쓸 수 있어요.`);

/* 비밀번호는 trim하지 않는다. 앞뒤 공백을 조용히 지우면
   사용자가 입력한 것과 저장되는 것이 달라진다. */
export const passwordField = z
	.string("값이 올바르지 않아요.")
	.min(PASSWORD_MIN_LENGTH, `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상으로 입력해 주세요.`)
	.max(PASSWORD_MAX_LENGTH, `비밀번호는 ${PASSWORD_MAX_LENGTH}자까지 쓸 수 있어요.`)
	.regex(/[A-Za-z]/, "비밀번호에 영문을 포함해 주세요.")
	.regex(/[0-9]/, "비밀번호에 숫자를 포함해 주세요.");

export const signupForm = z
	.object({
		email: emailField,
		userName: userNameField,
		password: passwordField,
		passwordRepeat: z.string("값이 올바르지 않아요.").min(1, "비밀번호 확인을 입력해 주세요."),
		/* 만 15세 미만은 가입할 수 없다. 법(개인정보 보호법 제22조의2)이 요구하는 선은 만 14세이고, 15세는 허용하는 그림 수위(15세 이용가 게임 공식 일러스트 수준)에 맞춘 운영 기준이다. 소셜 가입은 auth/ageConsent.ts */
		ageConfirmed: z.boolean("값이 올바르지 않아요.").refine((value) => value, "만 15세 이상만 가입할 수 있어요."),
	})
	.refine((data) => data.password === data.passwordRepeat, {
		message: "비밀번호가 서로 달라요.",
		path: ["passwordRepeat"],
	});

export type SignupFormType = z.infer<typeof signupForm>;
