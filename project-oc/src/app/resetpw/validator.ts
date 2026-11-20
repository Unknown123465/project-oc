import z from "zod";
import {emailField, userNameField} from "@/app/signup/validator";
import {changePasswordForm} from "@/app/setting/validator";

/* 가입과 같은 규칙으로 검사한다. 규칙이 다르면 가입할 때 쓴 값을 여기서 못 넣을 수 있다. */
export const requestPasswordResetForm = z.object({
	email: emailField,
	userName: userNameField,
});

export type RequestPasswordResetFormType = z.infer<typeof requestPasswordResetForm>;

/* 새 비밀번호 칸은 비밀번호 변경과 같은 것을 쓴다. changePasswordForm에는 refine이 있어
   .pick()을 부르면 zod가 예외를 던진다. 그래서 shape에서 칸만 꺼내고, 두 칸이 같은지는 여기서 다시 검사한다. */
export const resetPasswordForm = z
	.object({
		newPassword: changePasswordForm.shape.newPassword,
		newPasswordRepeat: changePasswordForm.shape.newPasswordRepeat,
	})
	.refine((data) => data.newPassword === data.newPasswordRepeat, {
		message: "새 비밀번호가 일치하지 않아요.",
		path: ["newPasswordRepeat"],
	});

export type ResetPasswordFormType = z.infer<typeof resetPasswordForm>;
