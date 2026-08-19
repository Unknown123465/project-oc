import NextAuth from "next-auth";
import GoogleProvider, {type GoogleProfile} from "next-auth/providers/google";
import NaverProvider, {type NaverProfile} from "next-auth/providers/naver";
import KakaoProvider, {type KakaoProfile} from "next-auth/providers/kakao";
import TwitterProvider from "next-auth/providers/twitter";
import {PrismaAdapter} from "@auth/prisma-adapter";
import type {Provider} from "next-auth/providers";
import db from "@/prisma/client";
import {withAccelerate} from "@prisma/extension-accelerate";
import Credentials from "next-auth/providers/credentials"; //https://authjs.dev/getting-started/authentication/credentials

const prisma = await db.$extends(withAccelerate());

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
	adapter: PrismaAdapter(prisma),
	providers,
	debug: true,
	secret: process.env.BETTER_AUTH_SECRET,
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
	},
	pages: {
		signIn: "/login",
		signOut: "/logout",
	},
});
