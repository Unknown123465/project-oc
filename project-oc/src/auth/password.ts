import "server-only";
import {compare, hash} from "bcryptjs";

const SALT_ROUNDS: number = 12;

/* 존재하지 않는 계정으로 로그인을 시도했을 때 대신 비교할 더미 해시.
   계정이 없다고 곧바로 돌려보내면 bcrypt 비교를 건너뛴 만큼 응답이 빨라져
   응답 시간만으로 가입 여부를 훑어볼 수 있다.
   임의의 UUID를 같은 SALT_ROUNDS로 해싱한 실제 해시라 비교 비용이 동일하다. */
const DUMMY_HASH: string = "$2b$12$Dv6p3UIFTy2IOOe4Z9rqZ.qOJZCX65VZbGaB72JDJK1Wvygdwfwj2";

export async function hashPassword(password: string): Promise<string> {
	return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string | null): Promise<boolean> {
	if (passwordHash !== null) {
		return compare(password, passwordHash);
	} else {
		await compare(password, DUMMY_HASH);

		return false;
	}
}
