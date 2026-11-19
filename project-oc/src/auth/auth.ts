import NextAuth from "next-auth";
import GoogleProvider, {type GoogleProfile} from "next-auth/providers/google";
import NaverProvider, {type NaverProfile} from "next-auth/providers/naver";
import KakaoProvider, {type KakaoProfile} from "next-auth/providers/kakao";
import TwitterProvider from "next-auth/providers/twitter";
import {PrismaAdapter} from "@auth/prisma-adapter";
import type {Provider} from "next-auth/providers";
import type {Adapter, AdapterUser} from "next-auth/adapters";
import db from "@/prisma/client";
import Credentials from "next-auth/providers/credentials"; //https://authjs.dev/getting-started/authentication/credentials
import {verifyPassword} from "./password";
import {credentialsLogin} from "./credentialsValidator";
import {resolveUniqueUserName} from "./userName";
import {getSessionUser} from "./sessionUser";
import {NORMAL_PROVIDER} from "./provider";

/* NORMAL_PROVIDER는 provider.ts로 옮겼다. 기존 import 경로가 그대로 동작하도록 여기서도 내보낸다. */
export {NORMAL_PROVIDER};

const SESSION_MAX_AGE_DAYS: number = 7;

const providers: Provider[] = [
	Credentials({
		credentials: {
			userName: {label: "사용자 이름", type: "text"},
			password: {label: "비밀번호", type: "password"},
		},
		async authorize(credentials) {
			const check = credentialsLogin.safeParse(credentials);

			if (!check.success) {
				return null;
			}

			const {userName, password} = check.data;

			const user = await db.user.findUnique({
				where: {
					username: userName,
				},
				include: {
					accounts: {
						select: {
							provider: true,
						},
						where: {
							provider: NORMAL_PROVIDER,
						},
					},
				},
			});

			/* username은 있지만 소셜로만 가입한 계정일 수 있다. 그런 계정은 password가
			   항상 null이라 verifyPassword에서도 걸리지만, accounts로 한 번 더 명시적으로
			   막아 이 게이트가 실제로 무엇을 확인하는지 코드로 드러낸다. */
			const hasNormalAccount: boolean = Array.isArray(user?.accounts) && user.accounts.length > 0;

			/* 계정이 없거나 normal 계정이 아닐 때도 verifyPassword를 거친다. 안에서
			   더미 해시와 비교해 실패 사유에 따라 응답 시간이 갈리지 않게 한다. */
			const matched: boolean = await verifyPassword(password, hasNormalAccount ? user!.password : null);

			if (user === null || !hasNormalAccount || !matched) {
				return null;
			}

			/* password는 절대 돌려주지 않는다. 여기서 반환한 값이 그대로 토큰에 실린다. */
			return {
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
			};
		},
	}),
	GoogleProvider<GoogleProfile>({
		clientId: process.env.GOOGLE_CLIENT_ID,
		clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		profile(profile) {
			return {
				id: profile.sub,
				email: profile.email,
				name: `${profile.family_name ?? ""}${profile.given_name}`,
				image: profile.picture,
			};
		},
	}),
	NaverProvider<NaverProfile>({
		clientId: process.env.NAVER_CLIENT_ID,
		clientSecret: process.env.NAVER_CLIENT_SECRET,
		profile(profile) {
			return {
				id: profile.response.id,
				email: profile.response.email,
				name: profile.response.nickname,
				image: profile.response.profile_image,
			};
		},
	}),
	KakaoProvider<KakaoProfile>({
		clientId: process.env.KAKAO_CLIENT_ID,
		clientSecret: process.env.KAKAO_CLIENT_SECRET,
		profile(profile) {
			return {
				id: profile.id.toString(),
				email: profile.kakao_account?.email || null,
				name: profile.properties?.nickname,
				image: profile.properties?.profile_image || null,
			};
		},
	}),
	TwitterProvider({
		clientId: process.env.TWITTER_CLIENT_ID,
		clientSecret: process.env.TWITTER_CLIENT_SECRET,
		profile(profile) {
			return {
				id: profile.data.id,
				email: profile.data.email,
				name: profile.data.name,
				image: profile.data.profile_image_url || null,
			};
		},
	}),
];

export const authProviders = providers
	.map((provider) => {
		if (typeof provider === "function") {
			const data = provider();

			return {id: data.id, name: data.name};
		} else {
			return {id: provider.id, name: provider.name};
		}
	})
	.reduce<Record<string, string>>((prev, current) => ({...prev, [current.name]: current.id}), {});

const prismaAdapter = PrismaAdapter(db);

/* 소셜 가입자에게도 username을 채운다. Auth.js는 name만 넘겨주고
   PrismaAdapter는 그대로 저장하므로 여기서 끼어들어야 한다.
   createUser는 계정을 처음 만들 때만 불리므로 로그인마다 조회하지 않는다. */
const adapter: Adapter = {
	...prismaAdapter,
	async createUser(user) {
		/* 넘어온 값을 통째로 펼치지 않고 쓸 컬럼만 적는다. id는 적지 않아야
		   Prisma가 cuid를 만든다(PrismaAdapter 원본도 id를 떼고 넘긴다).
		   provider profile이 실어 보낸 값이 그대로 컬럼에 닿지도 않는다. */
		const created = await db.user.create({
			data: {
				name: user.name,
				email: user.email,
				emailVerified: user.emailVerified,
				image: user.image,
				username: await resolveUniqueUserName(user.name),
			},
		});

		/* Prisma의 User는 email이 nullable이라 AdapterUser와 어긋난다.
		   PrismaAdapter 원본도 같은 이유로 내부에서 타입을 풀고 쓴다. */
		return created as AdapterUser;
	},
};

export const {handlers, auth, signIn, signOut, unstable_update} = NextAuth({
	adapter,
	providers,
	secret: process.env.AUTH_SECRET,
	/* adapter가 있으면 기본값이 database이지만 Credentials는 그 전략을 쓸 수 없다.
	   Auth.js는 credentials 로그인을 처리할 때 전략과 무관하게 세션 쿠키에 JWT를 굽는데,
	   database 전략의 세션 조회는 그 쿠키 값을 Session.sessionToken으로 찾으므로
	   로그인은 성공해도 곧바로 비로그인 상태가 된다.
	   Session 테이블만 쓰이지 않게 되고 User / Account 적재는 adapter가 그대로 맡는다. */
	session: {
		strategy: "jwt",
		/* 세션 최대 유지 시간 (단위: 초) */
		maxAge: 60 * 60 * 24 * SESSION_MAX_AGE_DAYS,
	},
	callbacks: {
		signIn({account, profile}) {
			if (account?.provider === "google") {
				return profile?.email_verified === true;
			} else if (account?.provider === "naver") {
				return true;
			} else {
				return true;
			}
		},
		/* 세션을 읽을 때마다 불린다. 계정이 지워졌거나 비밀번호를 바꿔 세션 버전이 올라갔으면
		   null을 돌려 세션을 끊는다. JWT 전략은 서버에 세션을 저장하지 않아서, 이렇게 DB와
		   맞춰 보지 않으면 이미 발급된 토큰을 만료 전까지 막을 방법이 없다.
		   일반 계정(Credentials)은 DB 세션 전략을 쓸 수 없어 JWT를 유지한다. */
		async jwt({token, user}) {
			/* user는 로그인한 그 요청에만 들어온다. 그때 지금 버전을 토큰에 새긴다. */
			const userId: string | undefined = user?.id ?? token.sub;

			if (!userId) {
				return null;
			}

			const sessionUser = await getSessionUser(userId);

			if (sessionUser === null) {
				return null;
			}

			if (user) {
				token.sessionVersion = sessionUser.sessionVersion;
			} else if (token.sessionVersion !== sessionUser.sessionVersion) {
				return null;
			}

			return token;
		},
		/* 토큰에 무엇이 실려 있든 세션에는 이 네 개만 옮긴다.
		   password 같은 값이 나중에 토큰에 섞여도 클라이언트로 새지 않는다. */
		session({session, token}) {
			return {
				...session,
				user: {
					id: token.sub,
					name: token.name,
					email: token.email,
					image: token.picture,
				},
			};
		},
	},
	pages: {
		signIn: "/login",
		signOut: "/logout",
		error: "/login",
	},
});
