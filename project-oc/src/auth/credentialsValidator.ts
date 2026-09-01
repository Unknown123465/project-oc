import z from "zod";

/* authorize가 받는 credentials는 Record<string, unknown>이라 타입을 믿을 수 없다.
   로그인 폼 검증기와 달리 길이 규칙을 두지 않는다. 규칙을 걸면 규칙이 바뀌었을 때
   기존 가입자가 로그인하지 못하게 되고, 어차피 해시 비교에서 걸러진다. */
export const credentialsLogin = z.object({
	userName: z.string().trim().min(1),
	password: z.string().min(1),
});
