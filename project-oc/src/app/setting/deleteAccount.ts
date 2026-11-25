"use server";

import {refresh, updateTag} from "next/cache";
import db from "@/prisma/client";
import {auth, signOut} from "@/auth/auth";
import {identityHashOf} from "@/auth/identityHash";
import {binToUuid} from "@/prisma/uuid";
import {charImageBucket, charImageKey, removeCharImage} from "@/app/create/r2";
import {characterTag} from "@/app/template/[uuid]/getCharacter";

interface DeleteSuccessReslut {
	success: true;
	result: number;
}

interface DeleteFailureResult {
	success: false;
	message: string;
}

type DeleteResult = DeleteSuccessReslut | DeleteFailureResult;

interface DeletedCharacter {
	charPublicLink: Uint8Array;
	charPublicMode: number;
	charImage: string;
}

/* DB에서 지운 프로필의 캐시와 R2 이미지를 정리한다. 프로필 하나를 지울 때(template/[uuid]/deleteCharacter.ts)와 같은 방식이다.
   R2 삭제는 실패해도 removeCharImage가 로그만 남기고 넘어간다. DB는 이미 지워졌으므로
   여기서 실패를 사용자에게 돌려줄 이유가 없다. */
async function cleanUpCharacters(userId: string, characters: DeletedCharacter[]): Promise<void> {
	for (const {charPublicLink} of characters) {
		updateTag(characterTag(binToUuid(charPublicLink)));
	}

	await Promise.allSettled(
		characters.map(({charPublicMode, charImage}) =>
			removeCharImage(charImageBucket(charPublicMode), charImageKey(userId, charImage), {
				connectionTimeout: 1000 * 3,
				requestTimeout: 1000 * 5,
				throwOnRequestTimeout: true,
			})
		)
	);
}

/** 만든 프로필을 모두 지운다. 프로필에 달린 좋아요와 코멘트는 FK의 Cascade로 같이 지워진다. */
export async function deleteAllCharacters(): Promise<DeleteResult> {
	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return {success: false, message: "로그인이 필요해요. 다시 로그인해 주세요."};
	}

	const userId: string = authInfo.user.id;

	let characters: DeletedCharacter[];

	try {
		characters = await db.$transaction(async (t) => {
			const targets = await t.character.findMany({
				where: {
					charUploaderId: userId,
				},
				select: {
					charPublicLink: true,
					charPublicMode: true,
					charImage: true,
				},
			});

			await t.character.deleteMany({
				where: {
					charUploaderId: userId,
				},
			});

			return targets;
		});
	} catch (err) {
		console.error("프로필 모두 삭제 실패", {userId, err});

		return {
			success: false,
			message: "프로필을 지우지 못했어요. 잠시 후 다시 시도해 주세요.",
		};
	}

	await cleanUpCharacters(userId, characters);

	refresh();

	return {
		success: true,
		result: characters.length,
	};
}

/* 계정과 함께 만든 프로필, 보낸 좋아요와 코멘트를 지운다. AiHistory는 남긴다.
   남기는 기록에는 이메일(일반) 또는 소셜 계정 번호의 HMAC을 채워서, 같은 날 다시 가입해
   AI 초안 하루 한도를 되살리지 못하게 한다. 이 값은 크론이 30일 뒤 행째 지운다.

   Character와 Account는 User를 RESTRICT로 가리켜 먼저 지워야 한다. 해시는 Account의
   providerAccountId가 필요하므로 Account를 지우기 전에 계산한다. */
export async function deleteAccount(): Promise<DeleteResult> {
	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return {
			success: false,
			message: "로그인이 필요해요. 다시 로그인해 주세요.",
		};
	}

	const userId: string = authInfo.user.id;

	let characters: DeletedCharacter[];

	try {
		characters = await db.$transaction(async (t) => {
			const originUser = await t.user.findUnique({
				where: {
					id: userId,
				},
				select: {
					email: true,
					accounts: {
						select: {
							provider: true,
							providerAccountId: true,
						},
					},
				},
			});

			if (originUser === null) {
				throw new Error("계정이 이미 없음");
			}

			const account = originUser.accounts[0];

			const identityHash: string | null = account ? identityHashOf({...account, email: originUser.email}) : null;

			/* 해시 없이 지우면 그 기록은 크론이 지울 대상으로 잡히지 않고, 재가입 확인에도 쓰이지 않는다.
			   키 설정이 빠진 경우라 삭제를 멈추고 로그로 알린다. */
			if (identityHash === null) {
				throw new Error("식별값을 만들지 못함");
			}

			await t.aiHistory.updateMany({
				data: {
					identityHash,
				},
				where: {
					userId,
				},
			});

			const originCharacters = await t.character.findMany({
				where: {
					charUploaderId: userId,
				},
				select: {
					charPublicLink: true,
					charPublicMode: true,
					charImage: true,
				},
			});

			await t.character.deleteMany({
				where: {
					charUploaderId: userId,
				},
			});
			await t.verificationToken.deleteMany({
				where: {
					identifier: userId,
				},
			});
			await t.account.deleteMany({
				where: {
					userId,
				},
			});
			await t.user.delete({
				where: {
					id: userId,
				},
			});

			return originCharacters;
		});
	} catch (err) {
		console.error("계정 삭제 실패", {userId, err});

		return {success: false, message: "계정을 지우지 못했어요. 잠시 후 다시 시도해 주세요."};
	}

	await cleanUpCharacters(userId, characters);

	/* 계정 행이 없어 다음 요청부터 세션이 끊기지만, 쿠키에 남은 토큰은 바로 지운다. */
	await signOut({
		redirect: false,
	});

	return {
		success: true,
		result: characters.length,
	};
}
