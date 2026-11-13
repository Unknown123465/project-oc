"use server";

import {auth} from "@/auth/auth";
import db from "@/prisma/client";
import {isUuid, uuidToBin} from "@/prisma/uuid";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/client";
import {PUBLIC_MODE_PRIVATE} from "@/app/create/r2";
import type {ProfileLikeView} from "@/app/_components/template/ProfileLike";

interface SetCharacterLikeSuccessResult {
	success: true;
	count: number;
	result: "insert" | "delete";
}

type FailureReason = "not-a-uuid" | "not-logged-in" | "character-not-found" | "attempt-self-like";
type FailureDBWorkReason = "attempt-try-twice" | "no-delete-row" | "fk-error" | "db-error";
interface SetCharacterLikeFailureResult {
	success: false;
	reason: FailureReason;
}

interface SetCharacterLikeFailureDBWorkResult {
	success: false;
	reason: FailureDBWorkReason;
}

type SetCharacterLikeResult = SetCharacterLikeSuccessResult | SetCharacterLikeFailureResult | SetCharacterLikeFailureDBWorkResult;
export async function getCharacterLike(uuid: string): Promise<ProfileLikeView | null> {
	if (typeof uuid !== "string" || !isUuid(uuid)) {
		return null;
	}

	const authInfo = await auth();

	const userId = authInfo?.user?.id;
	const binUuid = uuidToBin(uuid);

	const result = await db.character.findUnique({
		where: {
			charPublicLink: binUuid,
		},
		select: {
			charPublicMode: true,
			charUploaderId: true,
			_count: {
				select: {
					characterLikes: true,
				},
			},
			characterLikes: userId
				? {
						where: {
							userId,
						},
						select: {
							userId: true,
						},
					}
				: false,
		},
	});

	if (result === null || result?.charPublicMode === PUBLIC_MODE_PRIVATE) {
		return null;
	} else {
		return {
			count: result._count.characterLikes,
			liked: Array.isArray(result.characterLikes) && result.characterLikes.length > 0,
			isOwner: result.charUploaderId === userId,
		};
	}
}

export async function setCharacterLike(uuid: string): Promise<SetCharacterLikeResult> {
	if (typeof uuid !== "string" || !isUuid(uuid)) {
		return {
			success: false,
			reason: "not-a-uuid",
		};
	}

	const authInfo = await auth();

	if (!authInfo?.user?.id) {
		return {
			success: false,
			reason: "not-logged-in",
		};
	}

	const userId: string = authInfo.user.id;

	const character = await db.character.findUnique({
		where: {
			charPublicLink: uuidToBin(uuid),
		},
		select: {
			charId: true,
			charPublicMode: true,
			charUploaderId: true,
		},
	});

	if (character === null) {
		return {
			success: false,
			reason: "character-not-found",
		};
	}

	const {charId, charPublicMode, charUploaderId} = character;

	if (charPublicMode === PUBLIC_MODE_PRIVATE) {
		console.warn("비공개 프로필에서 좋아요 요청을 시도함");

		return {
			success: false,
			reason: "character-not-found",
		};
	} else if (charUploaderId === userId) {
		return {
			success: false,
			reason: "attempt-self-like",
		};
	}

	let result: SetCharacterLikeSuccessResult["result"] | null = null;

	try {
		const finalResult = await db.$transaction(async (t) => {
			const likeExist = await t.characterLike.findUnique({
				where: {
					charId_userId: {
						charId,
						userId,
					},
				},
			});

			result = likeExist === null ? "insert" : "delete";

			if (result === "insert") {
				await t.characterLike.create({
					data: {
						charId,
						userId,
					},
				});
			} else {
				await t.characterLike.delete({
					where: {
						charId_userId: {
							charId,
							userId,
						},
					},
				});
			}

			const count = await t.characterLike.count({
				where: {
					charId,
				},
			});

			return {
				count,
				result,
			};
		});

		return {
			success: true,
			...finalResult,
		};
	} catch (err) {
		console.error(err);

		if (!(err instanceof PrismaClientKnownRequestError)) {
			return {
				success: false,
				reason: "db-error",
			};
		} else if ((err.code === "P2002" || err.code === "P2025") && result !== null) {
			const count = await db.characterLike
				.count({
					where: {
						charId,
					},
				})
				.catch((err2) => {
					console.error(err2);

					result = null;

					return null;
				});

			if (count !== null) {
				return {
					success: true,
					result,
					count,
				};
			} else {
				return {
					success: false,
					reason: err.code === "P2002" ? "attempt-try-twice" : "no-delete-row",
				};
			}
		} else if (err.code === "P2003") {
			return {
				success: false,
				reason: "fk-error",
			};
		} else {
			return {
				success: false,
				reason: "db-error",
			};
		}
	}
}
