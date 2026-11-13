"use server";

import {auth} from "@/auth/auth";
import {createCharServerForm, editCharServerForm, EditCharServerFormType, MAX_TEMPLATE_LIMIT, type CreateCharServerFormType} from "./validator";
import db from "@/prisma/client";
import {uuidToBin} from "@/prisma/uuid";
import {v7 as uuidv7} from "uuid";
import {charImageBucket, charImageKey, charImageTempKey, copyCharImage, headCharImage, removeCharImage} from "./r2";
import {IMAGE_MAX_FILE_SIZE, IMAGE_UPLOAD_TYPE} from "./imageEditor";
import {updateTag} from "next/cache";
import {characterTag} from "../template/[uuid]/getCharacter";
import {CHAR_ACTION_MESSAGE} from "./charActionMessage";

interface CharActionSuccessResult {
	success: true;
	link: string;
}

interface CharActionFailureResult {
	success: false;
	message: string;
}

type CharActionResult = CharActionSuccessResult | CharActionFailureResult;

interface UpdateCharSuccessResult {
	success: true;
	originBucket: string;
	originKey: string;
}

interface UpdateCharFailureResult {
	success: false;
	message: string;
}

type UpdateCharResult = UpdateCharSuccessResult | UpdateCharFailureResult;

async function updateChar(data: EditCharServerFormType, charImageName: string | null, userId: string, binUuid: ReturnType<typeof uuidToBin>): Promise<UpdateCharResult> {
	const charTmi: string[] = data.charTmi.split("\n").filter((tmi) => tmi.trim());

	const result: UpdateCharResult = await db.$transaction(async (t) => {
		const originData = await t.character.findUnique({
			where: {
				charPublicLink: binUuid,
			},
			select: {
				charId: true,
				charUploaderId: true,
				charImage: true,
				charPublicMode: true,
			},
		});

		if (originData === null) {
			return {
				success: false,
				message: CHAR_ACTION_MESSAGE.notFound,
			};
		} else if (originData.charUploaderId !== userId) {
			return {
				success: false,
				message: CHAR_ACTION_MESSAGE.notOwner,
			};
		}

		await t.character.update({
			data: {
				charName: data.charName,
				charImage: charImageName ?? undefined,
				charProfileLayout: data.charProfileLayout,
				charImageFrame: data.charImageFrame,
				charMessage: data.charMessage,
				charKind: data.charKind || null,
				charColor: data.charColor,
				charMusic: data.charMusic || null,
				charLike: data.charLike || null,
				charHate: data.charHate || null,
				charMbti: data.charMbti || null,
				charBirthplace: data.charBirthplace || null,
				charAge: data.charAge || null,
				charBirthday: data.charBirthday || null,
				charHeight: data.charHeight || null,
				charPersonality: data.charPersonality || null,
				charTmi,
				charPublicMode: parseInt(data.publicMode, 10),
				aiUsed: parseInt(data.aiUsed, 10),
			},
			where: {
				charPublicLink: binUuid,
				charUploaderId: userId,
			},
		});

		return {
			success: true,
			originBucket: charImageBucket(originData.charPublicMode),
			originKey: charImageKey(userId, originData.charImage),
		};
	});

	return result;
}

export async function createCharAction(data: CreateCharServerFormType): Promise<CharActionResult> {
	const authInfo = await auth();

	if (authInfo === null || !authInfo.user) {
		return {
			success: false,
			message: CHAR_ACTION_MESSAGE.notLoggedIn,
		};
	}

	const check = createCharServerForm.safeParse(data);

	if (!check.success) {
		return {
			success: false,
			message: check.error.issues[0].message,
		};
	}

	const user = await db.user.findUnique({
		where: {
			id: authInfo.user.id,
		},
		include: {
			characters: {
				select: {
					charId: true,
					charImage: true,
				},
			},
		},
	});

	if (user === null) {
		return {
			success: false,
			message: CHAR_ACTION_MESSAGE.userNotFound,
		};
	} else if (user.characters.length >= MAX_TEMPLATE_LIMIT) {
		return {
			success: false,
			message: CHAR_ACTION_MESSAGE.limitExceeded(MAX_TEMPLATE_LIMIT),
		};
	}

	const charImageName: string = check.data.charImageName;
	const bucket: string = charImageBucket(parseInt(check.data.publicMode, 10));
	const tempKey: string = charImageTempKey(user.id, charImageName);
	const key: string = charImageKey(user.id, charImageName);

	/* 이미 다른 캐릭터가 쓰는 이미지를 가리키면 나중에 한쪽을 지울 때 남은 쪽의
	   이미지까지 사라진다. 이름은 업로드마다 새로 발급되므로 정상 흐름에서는
	   걸릴 일이 없고, 손으로 만든 요청만 여기서 막힌다. */
	if (user.characters.some((character) => character.charImage === charImageName)) {
		return {
			success: false,
			message: CHAR_ACTION_MESSAGE.imageInUse,
		};
	}

	/* 업로드는 브라우저가 직접 했으므로 올라왔다는 말을 그대로 믿지 않고 확인한다.
	   여기서 못 찾으면 아직 아무것도 올라오지 않았다는 뜻이라 지울 것도 없다. */
	let uploaded;

	try {
		uploaded = await headCharImage(bucket, tempKey);
	} catch {
		return {
			success: false,
			message: CHAR_ACTION_MESSAGE.imageNotUploaded,
		};
	}

	const uploadedSize: number = uploaded.ContentLength ?? 0;

	if (uploaded.ContentType !== IMAGE_UPLOAD_TYPE || uploadedSize <= 0 || uploadedSize > IMAGE_MAX_FILE_SIZE) {
		await removeCharImage(bucket, tempKey);

		return {
			success: false,
			message: CHAR_ACTION_MESSAGE.imageInvalid,
		};
	}

	try {
		const publicLink: string = uuidv7();

		/* 검증을 마친 뒤에야 최종 경로로 옮긴다. 여기서부터는 실패해도 사본이 남으므로
		   아래 catch에서 두 경로를 모두 지운다. */
		await copyCharImage(bucket, tempKey, key);

		/* 빈 줄은 TMI가 아니다. 빈 값일 때 빈 항목이 생기지 않게 빈 줄은 지워낸다. */
		const charTmi: string[] = check.data.charTmi.split("\n").filter((tmi) => tmi.trim());

		/* 쓰는 테이블이 character 하나뿐이라 트랜잭션으로 감싸지 않는다. 단일 INSERT는
		   그 자체로 원자적이고, 묶어 봐야 함께 되돌릴 상대가 없다. 되돌려야 하는 건
		   R2에 올라간 이미지인데 그건 DB 트랜잭션 밖이라 아래 catch에서 직접 지운다. */
		await db.character.create({
			data: {
				charName: check.data.charName,
				charImage: charImageName,
				charProfileLayout: check.data.charProfileLayout,
				charImageFrame: check.data.charImageFrame,
				charMessage: check.data.charMessage,
				charKind: check.data.charKind || null,
				charColor: check.data.charColor,
				charMusic: check.data.charMusic || null,
				charLike: check.data.charLike || null,
				charHate: check.data.charHate || null,
				charMbti: check.data.charMbti || null,
				charBirthplace: check.data.charBirthplace || null,
				charAge: check.data.charAge || null,
				charBirthday: check.data.charBirthday || null,
				charHeight: check.data.charHeight || null,
				charPersonality: check.data.charPersonality || null,
				charTmi,
				charPublicMode: parseInt(check.data.publicMode, 10),
				aiUsed: parseInt(check.data.aiUsed, 10),
				charPublicLink: uuidToBin(publicLink),
				charUploaderId: user.id,
			},
		});

		/* 등록이 끝났으니 임시 사본은 쓸모가 없다. 지우지 못해도 수명 주기 규칙이
		   하루 뒤 정리하므로 여기서 실패를 따로 다루지 않는다. */
		await removeCharImage(bucket, tempKey);

		return {
			success: true,
			link: `/template/${publicLink}`,
		};
	} catch (err) {
		/* 등록이 깨지면 올라간 이미지는 어디서도 참조되지 않는 채로 남아 요금만
		   나간다. 사용자에게 보여줄 메시지와 별개로 여기서 반드시 지운다.
		   복사 전에 깨졌다면 최종 경로 삭제는 그냥 헛일이 될 뿐이라 무해하다. */
		console.error("프로필 등록 실패", err);

		await Promise.allSettled([
			removeCharImage(bucket, key, {
				connectionTimeout: 1000 * 3,
				requestTimeout: 1000 * 5,
				throwOnRequestTimeout: true,
			}),
			removeCharImage(bucket, tempKey),
		]);

		return {
			success: false,
			message: CHAR_ACTION_MESSAGE.createFailed,
		};
	}
}

export async function editCharAction(data: EditCharServerFormType, link: unknown = "profile"): Promise<CharActionResult> {
	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return {
			success: false,
			message: CHAR_ACTION_MESSAGE.notLoggedIn,
		};
	}

	const userId: string = authInfo.user.id;

	const check = editCharServerForm.safeParse(data);

	if (!check.success) {
		return {
			success: false,
			message: check.error.issues[0].message,
		};
	}

	const user = await db.user.findUnique({
		where: {
			id: userId,
		},
		include: {
			characters: {
				select: {
					charId: true,
					charImage: true,
				},
			},
		},
	});

	if (user === null) {
		return {
			success: false,
			message: CHAR_ACTION_MESSAGE.userNotFound,
		};
	}

	const {uuid} = check.data;
	const binUuid = uuidToBin(uuid);

	const originData = await db.character.findUnique({
		where: {
			charPublicLink: binUuid,
		},
		select: {
			charId: true,
			charUploaderId: true,
			charPublicMode: true,
			charImage: true,
			charProfileLayout: true,
			charImageFrame: true,
		},
	});

	if (originData === null) {
		return {
			success: false,
			message: CHAR_ACTION_MESSAGE.notFound,
		};
	} else if (originData.charUploaderId !== userId) {
		return {
			success: false,
			message: CHAR_ACTION_MESSAGE.notOwner,
		};
	}

	const charImageName: string | null = check.data.charImageName;

	if (charImageName === null && (originData.charProfileLayout !== check.data.charProfileLayout || originData.charImageFrame !== check.data.charImageFrame)) {
		return {
			success: false,
			message: CHAR_ACTION_MESSAGE.layoutChangeWithoutImage,
		};
	}

	if (charImageName !== null) {
		const bucket: string = charImageBucket(parseInt(check.data.publicMode, 10));
		const tempKey: string = charImageTempKey(userId, charImageName);
		const key: string = charImageKey(userId, charImageName);

		if (user.characters.some((character) => character.charImage === charImageName)) {
			return {
				success: false,
				message: CHAR_ACTION_MESSAGE.imageInUse,
			};
		}

		let uploaded;

		try {
			uploaded = await headCharImage(bucket, tempKey);
		} catch {
			return {
				success: false,
				message: CHAR_ACTION_MESSAGE.imageNotUploaded,
			};
		}

		const uploadedSize: number = uploaded.ContentLength ?? 0;

		let updateResult;

		if (uploaded.ContentType !== IMAGE_UPLOAD_TYPE || uploadedSize <= 0 || uploadedSize > IMAGE_MAX_FILE_SIZE) {
			await removeCharImage(bucket, tempKey);

			return {
				success: false,
				message: CHAR_ACTION_MESSAGE.imageInvalid,
			};
		}

		try {
			await copyCharImage(bucket, tempKey, key);

			updateResult = await updateChar(check.data, charImageName, userId, binUuid);

			if (!updateResult.success) {
				await Promise.allSettled([removeCharImage(bucket, tempKey), removeCharImage(bucket, key)]);

				return {
					success: false,
					message: updateResult.message,
				};
			}

			updateTag(characterTag(check.data.uuid));
		} catch (err) {
			console.error("프로필 수정 실패(이미지 교체)", err);

			await Promise.allSettled([
				removeCharImage(bucket, tempKey),
				removeCharImage(bucket, key, {
					connectionTimeout: 1000 * 3,
					requestTimeout: 1000 * 5,
					throwOnRequestTimeout: true,
				}),
			]);

			return {
				success: false,
				message: CHAR_ACTION_MESSAGE.editFailed,
			};
		}

		await Promise.allSettled([
			removeCharImage(bucket, tempKey, {
				connectionTimeout: 1000 * 3,
				requestTimeout: 1000 * 5,
				throwOnRequestTimeout: true,
			}),
			removeCharImage(updateResult.originBucket, updateResult.originKey, {
				connectionTimeout: 1000 * 3,
				requestTimeout: 1000 * 5,
				throwOnRequestTimeout: true,
			}),
		]);

		return {
			success: true,
			link: link === "mylist" ? `/mylist?page=1` : `/template/${uuid}`,
		};
	} else if (charImageBucket(originData.charPublicMode) !== charImageBucket(parseInt(check.data.publicMode, 10))) {
		const originBucket: string = charImageBucket(originData.charPublicMode);
		const newBucket: string = charImageBucket(parseInt(check.data.publicMode, 10));
		const key: string = charImageKey(userId, originData.charImage);

		try {
			await copyCharImage(newBucket, key, key, {
				sourceBucket: originBucket,
			});
		} catch (err) {
			console.error("공개 또는 비공개 버킷으로 이미지 복사 실패", err);

			return {
				success: false,
				message: CHAR_ACTION_MESSAGE.editFailed,
			};
		}

		try {
			const updateResult = await updateChar(check.data, null, userId, binUuid);

			if (!updateResult.success) {
				await removeCharImage(newBucket, key, {
					connectionTimeout: 1000 * 3,
					requestTimeout: 1000 * 5,
					throwOnRequestTimeout: true,
				});

				return {
					success: false,
					message: updateResult.message,
				};
			}
		} catch (err) {
			console.error("프로필 DB 업데이트 실패", err);

			await removeCharImage(newBucket, key, {
				connectionTimeout: 1000 * 3,
				requestTimeout: 1000 * 5,
				throwOnRequestTimeout: true,
			});

			return {
				success: false,
				message: CHAR_ACTION_MESSAGE.editFailed,
			};
		}

		updateTag(characterTag(uuid));

		try {
			await removeCharImage(originBucket, key, {
				connectionTimeout: 1000 * 3,
				requestTimeout: 1000 * 5,
				throwOnRequestTimeout: true,
			});

			return {
				success: true,
				link: link === "mylist" ? `/mylist?page=1` : `/template/${uuid}`,
			};
		} catch (err) {
			console.error("과거 공개 또는 비공개 버킷에 있는 이미지 삭제 실패", err);

			return {
				success: true,
				link: link === "mylist" ? `/mylist?page=1` : `/template/${uuid}`,
			};
		}
	}

	try {
		const updateResult = await updateChar(check.data, charImageName, userId, binUuid);

		if (!updateResult.success) {
			return {
				success: false,
				message: updateResult.message,
			};
		}

		updateTag(characterTag(uuid));

		return {
			success: true,
			link: link === "mylist" ? `/mylist?page=1` : `/template/${uuid}`,
		};
	} catch (err) {
		console.error("프로필 수정 실패", err);

		return {
			success: false,
			message: CHAR_ACTION_MESSAGE.editFailed,
		};
	}
}
