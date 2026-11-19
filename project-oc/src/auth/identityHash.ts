import crypto from "crypto";
import {NORMAL_PROVIDER} from "./provider";

interface IdentitySource {
	provider: string;
	providerAccountId: string;
	email: string | null;
}

/* 탈퇴한 계정을 다시 알아보기 위한 값. 이메일이나 소셜 계정 번호를 그대로 남기지 않고
   HMAC-SHA256으로 바꿔 둔다. 키 없이 SHA-256만 쓰면 흔한 이메일을 미리 해시해 둔 표로
   되돌릴 수 있어서, 서버만 아는 키(AI_HISTORY_HASH_SECRET)를 섞는다.

   일반 계정은 이메일(앞뒤 공백을 자르고 소문자로), 소셜 계정은 "provider:providerAccountId"를
   쓴다. 제공자끼리 번호가 겹칠 수 있어 제공자 이름을 앞에 붙인다. 키가 없거나 일반 계정인데
   이메일이 없으면 null을 돌려준다. */
export function identityHashOf({provider, providerAccountId, email}: IdentitySource): string | null {
	const secret: string | undefined = process.env.AI_HISTORY_HASH_SECRET;

	if (!secret) {
		console.error("AI_HISTORY_HASH_SECRET이 없어 식별값을 만들지 못했어요.");

		return null;
	}

	let source: string = "";

	if (provider === NORMAL_PROVIDER) {
		if (email === null) {
			return null;
		}

		source = email.trim().toLowerCase();
	} else {
		source = `${provider}:${providerAccountId}`;
	}

	return crypto.createHmac("sha256", secret).update(source).digest("hex");
}
