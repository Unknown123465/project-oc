import NextAuth from "next-auth";
import GoogleProvider, {type GoogleProfile} from "next-auth/providers/google";
import NaverProvider, {type NaverProfile} from "next-auth/providers/naver";
import KakaoProvider, {type KakaoProfile} from "next-auth/providers/kakao";
import TwitterProvider from "next-auth/providers/twitter";
import {PrismaAdapter} from "@auth/prisma-adapter";
import type {Provider} from "next-auth/providers";
import db from "@/prisma/client";
import Credentials from "next-auth/providers/credentials"; //https://authjs.dev/getting-started/authentication/credentials

const providers: Provider[] = [
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
				id: profile.properties?.id,
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

export const {handlers, auth, signIn, signOut, unstable_update} = NextAuth({
	adapter: PrismaAdapter(db),
	providers,
	debug: true,
	secret: process.env.BETTER_AUTH_SECRET,
	/* adapter가 있으면 기본값이 database이지만 Credentials는 그 전략을 쓸 수 없다.
	   Auth.js는 credentials 로그인을 처리할 때 전략과 무관하게 세션 쿠키에 JWT를 굽는데,
	   database 전략의 세션 조회는 그 쿠키 값을 Session.sessionToken으로 찾으므로
	   로그인은 성공해도 곧바로 비로그인 상태가 된다.
	   Session 테이블만 쓰이지 않게 되고 User / Account 적재는 adapter가 그대로 맡는다. */
	session: {
		strategy: "jwt",
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
	},
});
