"use server";

import {updateTag} from "next/cache";
import db from "@/prisma/client";
import {charImageBucket, charImageKey, removeCharImage} from "@/app/create/r2";
import {isUuid, uuidToBin} from "@/prisma/uuid";
import {auth} from "@/auth/auth";
import {charactersMyListTag, characterTag} from "./getCharacter";
import {DELETE_CHARACTER_MESSAGE} from "./deleteCharacterMessage";

interface DeleteCharacterSuccessResult {
	success: true;
}

interface DeleteCharacterFailureResult {
	success: false;
	message: string;
	requireRefresh: boolean;
}

type DeleteCharacterResult = DeleteCharacterSuccessResult | DeleteCharacterFailureResult;

export async function deleteCharacter(uuid: unknown): Promise<DeleteCharacterResult> {
	if (typeof uuid !== "string" || !isUuid(uuid)) {
		return {
			success: false,
			message: DELETE_CHARACTER_MESSAGE.invalidUuid,
			requireRefresh: false,
		};
	}

	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return {
			success: false,
			message: DELETE_CHARACTER_MESSAGE.notLoggedIn,
			requireRefresh: false,
		};
	}

	const binUuid = uuidToBin(uuid);

	const originData = await db.character.findUnique({
		where: {
			charPublicLink: binUuid,
		},
		select: {
			charUploaderId: true,
			charPublicMode: true,
			charImage: true,
		},
	});

	if (originData === null) {
		return {
			success: false,
			message: DELETE_CHARACTER_MESSAGE.notFound,
			requireRefresh: true,
		};
	}

	const {charUploaderId, charPublicMode, charImage} = originData;
	const userId = authInfo.user.id;

	if (charUploaderId !== userId) {
		return {
			success: false,
			message: DELETE_CHARACTER_MESSAGE.notOwner,
			requireRefresh: false,
		};
	}

	try {
		const deleteResult = await db.character.deleteMany({
			where: {
				charPublicLink: binUuid,
				charUploaderId: userId,
			},
		});

		if (deleteResult.count === 0) {
			return {
				success: false,
				message: DELETE_CHARACTER_MESSAGE.alreadyDeleted,
				requireRefresh: true,
			};
		}

		updateTag(characterTag(uuid));
		updateTag(charactersMyListTag(userId));

		const bucket: string = charImageBucket(charPublicMode);
		const imageKey: string = charImageKey(userId, charImage);

		await removeCharImage(bucket, imageKey, {
			connectionTimeout: 1000 * 3,
			requestTimeout: 1000 * 5,
			throwOnRequestTimeout: true,
		}).catch((err) => console.error("R2 이미지 삭제 실패", {uuid, err}));

		return {
			success: true,
		};
	} catch (err) {
		console.error("프로필 삭제 실패", {uuid, err});

		return {
			success: false,
			message: DELETE_CHARACTER_MESSAGE.failed,
			requireRefresh: false,
		};
	}
}
