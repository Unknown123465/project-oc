"use server";

import db from "@/prisma/client";
import {isUuid, uuidToBin} from "@/prisma/uuid";
import {deleteOrHiddenCommentForm, type DeleteOrHiddenCommentFormType, editCommentForm, type EditCommentFormInputType, writeCommentForm, type WriteCommentFormType} from "./validator";
import {auth} from "@/auth/auth";
import {COMMENT_MESSAGE, type CommentFromTemplate} from "./commentMessage";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/client";
import {PUBLIC_MODE_PRIVATE} from "@/app/create/r2";
import {JUDGE_COMMENT_NULL_RESULT, judgeComment, judgeCommentScore, JudgeScore, setCommentScoreIfOwner} from "./commentJudge";
import {claimCommentJudge} from "./commentJudgeDraft";
import {getCommentJudgeEnabled} from "@/app/create/globalConfig";
import {updateTag} from "next/cache";
import {charactersMyListTag} from "./getCharacter";

const BLIND_COMMENT_SCORE: number | null = typeof process.env.BLIND_COMMENT_SCORE === "string" ? parseInt(process.env.BLIND_COMMENT_SCORE, 10) : null;

interface CommentSuccessResult {
	success: true;
}

interface CommentSuccessHiddenResult {
	success: true;
	result: "hide" | "show";
}

interface CommentFailureResult {
	success: false;
	message: string;
}

type CommentResult = CommentSuccessResult | CommentFailureResult;

type CommentHiddenResult = CommentSuccessHiddenResult | CommentFailureResult;

function getBlindable(score: JudgeScore<number | null>): boolean {
	if (BLIND_COMMENT_SCORE === null || Number.isNaN(BLIND_COMMENT_SCORE)) {
		return false;
	}

	return Object.values(score).some((value) => value !== null && value >= BLIND_COMMENT_SCORE);
}

export async function getCommentsByTemplate(uuid: string): Promise<CommentFromTemplate[] | null> {
	if (typeof uuid !== "string" || !isUuid(uuid)) {
		return null;
	}

	const comments = await db.characterComment.findMany({
		where: {
			character: {
				charPublicLink: uuidToBin(uuid),
			},
			/* 삭제된 코멘트를 출력할 필요가 없기 때문에 where에서 제외 시킨다. */
			deletedAt: null,
		},
		select: {
			commentId: true,
			charComment: true,
			createdAt: true,
			updatedAt: true,
			hiddenAt: true,
			spamScore: true,
			mockeryScore: true,
			ownerAttackScore: true,
			userAttackScore: true,
			sexualScore: true,
			goreScore: true,
			character: {
				select: {
					charPublicMode: true,
				},
			},
			user: {
				select: {
					name: true,
					username: true,
					id: true,
				},
			},
		},
		orderBy: [
			{
				createdAt: "asc",
			},
			{
				commentId: "asc",
			},
		],
	});

	/* 코멘트가 없거나 비공개 프로필이면 null을 반환한다. */
	if (comments.length === 0 || comments[0].character.charPublicMode === PUBLIC_MODE_PRIVATE) {
		return null;
	}

	const authInfo = await auth();

	return comments.map<CommentFromTemplate>((comment) => ({
		commentId: comment.commentId.toString(),
		userName: comment.user.username || "알 수 없음",
		charComment: comment.charComment,
		createdAt: comment.createdAt,
		updated: comment.updatedAt !== null,
		hidden: comment.hiddenAt !== null,
		isMine: comment.user.id === authInfo?.user?.id,
		blinded: getBlindable({
			spamScore: comment.spamScore,
			mockeryScore: comment.mockeryScore,
			ownerAttackScore: comment.ownerAttackScore,
			userAttackScore: comment.userAttackScore,
			sexualScore: comment.sexualScore,
			goreScore: comment.goreScore,
		}),
	}));
}

export async function writeComment(data: WriteCommentFormType): Promise<CommentResult> {
	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return {
			success: false,
			message: COMMENT_MESSAGE.notLoggedIn,
		};
	}

	const userId: string = authInfo.user.id;

	const check = writeCommentForm.safeParse(data);

	if (!check.success) {
		return {
			success: false,
			message: check.error.issues[0].message,
		};
	}

	const {uuid, comment} = check.data;

	try {
		const claim: boolean = await claimCommentJudge(userId);

		if (!claim) {
			return {
				success: false,
				message: COMMENT_MESSAGE.writeTooFast,
			};
		}

		const binUuid = uuidToBin(uuid);

		const originCharacter = await db.character.findUnique({
			where: {
				charPublicLink: binUuid,
			},
			select: {
				charId: true,
				charPublicMode: true,
				charUploaderId: true,
			},
		});

		if (originCharacter === null) {
			return {
				success: false,
				message: COMMENT_MESSAGE.profileNotFound,
			};
		} else if (originCharacter.charPublicMode === PUBLIC_MODE_PRIVATE) {
			return {
				success: false,
				message: COMMENT_MESSAGE.writePrivate,
			};
		}

		const isOwner: boolean = originCharacter.charUploaderId === userId;

		const judgeCommentEnabled: boolean = await getCommentJudgeEnabled();

		const judgeScore = judgeCommentEnabled ? setCommentScoreIfOwner(await judgeComment(comment), isOwner) : JUDGE_COMMENT_NULL_RESULT;

		const {isDeny, highestScoreType, retry} = judgeCommentScore(judgeScore);

		if (isDeny && highestScoreType !== null && highestScoreType !== "sexualScore" && highestScoreType !== "goreScore") {
			return {
				success: false,
				message: COMMENT_MESSAGE.deny[highestScoreType],
			};
		}

		const result: CommentResult = await db.$transaction(async (t) => {
			const originCharacterAfterJudge = await t.character.findUnique({
				where: {
					charPublicLink: binUuid,
				},
				select: {
					charPublicMode: true,
				},
			});

			if (originCharacterAfterJudge === null) {
				return {
					success: false,
					message: COMMENT_MESSAGE.profileNotFound,
				};
			} else if (originCharacterAfterJudge.charPublicMode === PUBLIC_MODE_PRIVATE) {
				return {
					success: false,
					message: COMMENT_MESSAGE.writePrivate,
				};
			}

			await t.characterComment.create({
				data: {
					userId,
					charId: originCharacter.charId,
					charComment: comment,
					...judgeScore,
					rejudgeCount: judgeCommentEnabled && retry ? 0 : null,
				},
			});

			return {
				success: true,
			};
		});

		updateTag(charactersMyListTag(originCharacter.charUploaderId));

		return result;
	} catch (err) {
		console.error(err);

		/* 프로필을 확인한 뒤 작성 전에 프로필이 지워지거나 작성자가 탈퇴하면 FK가 깨져 P2003으로 떨어진다. */
		if (err instanceof PrismaClientKnownRequestError && err.code === "P2003") {
			return {
				success: false,
				message: COMMENT_MESSAGE.writeTargetGone,
			};
		}

		return {
			success: false,
			message: COMMENT_MESSAGE.writeFailed,
		};
	}
}

export async function editComment(data: EditCommentFormInputType): Promise<CommentResult> {
	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return {
			success: false,
			message: COMMENT_MESSAGE.notLoggedIn,
		};
	}

	const userId: string = authInfo.user.id;

	const check = editCommentForm.safeParse(data);

	if (!check.success) {
		return {
			success: false,
			message: check.error.issues[0].message,
		};
	}

	const {uuid, commentId, comment} = check.data;

	try {
		const claim: boolean = await claimCommentJudge(userId);

		if (!claim) {
			return {
				success: false,
				message: COMMENT_MESSAGE.editTooFast,
			};
		}

		const binUuid = uuidToBin(uuid);

		const originData = await db.characterComment.findUnique({
			where: {
				character: {
					charPublicLink: binUuid,
				},
				commentId,
				deletedAt: null,
			},
			select: {
				userId: true,
				character: {
					select: {
						charPublicMode: true,
						charUploaderId: true,
					},
				},
			},
		});

		if (originData === null) {
			return {
				success: false,
				message: COMMENT_MESSAGE.notFound,
			};
		} else if (originData.character.charPublicMode === PUBLIC_MODE_PRIVATE) {
			return {
				success: false,
				message: COMMENT_MESSAGE.editPrivate,
			};
		} else if (userId !== originData.userId) {
			return {
				success: false,
				message: COMMENT_MESSAGE.editNotOwner,
			};
		}

		const isOwner: boolean = originData.character.charUploaderId === userId;

		const judgeCommentEnabled: boolean = await getCommentJudgeEnabled();

		const judgeScore = judgeCommentEnabled ? setCommentScoreIfOwner(await judgeComment(comment), isOwner) : JUDGE_COMMENT_NULL_RESULT;

		const {isDeny, highestScoreType, retry} = judgeCommentScore(judgeScore);

		if (isDeny && highestScoreType !== null && highestScoreType !== "sexualScore" && highestScoreType !== "goreScore") {
			return {
				success: false,
				message: COMMENT_MESSAGE.deny[highestScoreType],
			};
		}

		/* 코멘트 업데이트는 트랜잭션을 적용하지않는다. 쿼리가 하나밖에 없기 때문이다. */
		await db.characterComment.update({
			data: {
				charComment: comment,
				updatedAt: new Date(),
				...judgeScore,
				rejudgeCount: judgeCommentEnabled && retry ? 0 : null,
			},
			where: {
				character: {
					charPublicLink: binUuid,
					charPublicMode: {
						not: PUBLIC_MODE_PRIVATE,
					},
				},
				userId,
				commentId,
				deletedAt: null,
			},
		});

		return {
			success: true,
		};
	} catch (err) {
		console.error(err);

		/* 확인과 수정 사이에 코멘트가 지워지면 update가 대상 행을 못 찾아 P2025로 떨어진다. */
		if (err instanceof PrismaClientKnownRequestError && err.code === "P2025") {
			return {
				success: false,
				message: COMMENT_MESSAGE.notFound,
			};
		}

		return {
			success: false,
			message: COMMENT_MESSAGE.editFailed,
		};
	}
}

export async function deleteComment(data: DeleteOrHiddenCommentFormType): Promise<CommentResult> {
	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return {
			success: false,
			message: COMMENT_MESSAGE.notLoggedIn,
		};
	}

	const userId: string = authInfo.user.id;

	const check = deleteOrHiddenCommentForm.safeParse(data);

	if (!check.success) {
		return {
			success: false,
			message: check.error.issues[0].message,
		};
	}

	const {uuid, commentId} = check.data;

	try {
		const binUuid = uuidToBin(uuid);

		let charUploaderId: string | null = null;

		const result: CommentResult = await db.$transaction(async (t) => {
			const originData = await t.characterComment.findUnique({
				where: {
					character: {
						charPublicLink: binUuid,
					},
					commentId,
					deletedAt: null,
				},
				select: {
					userId: true,
					character: {
						select: {
							charPublicMode: true,
							charUploaderId: true,
						},
					},
				},
			});

			if (originData === null) {
				return {
					success: false,
					message: COMMENT_MESSAGE.notFound,
				};
			} else if (originData.character.charPublicMode === PUBLIC_MODE_PRIVATE) {
				return {
					success: false,
					message: COMMENT_MESSAGE.deletePrivate,
				};
			} else if (userId !== originData.userId) {
				return {
					success: false,
					message: COMMENT_MESSAGE.deleteNotOwner,
				};
			}

			await t.characterComment.update({
				data: {
					deletedAt: new Date(),
				},
				where: {
					character: {
						charPublicLink: binUuid,
						charPublicMode: {
							not: PUBLIC_MODE_PRIVATE,
						},
					},
					userId,
					commentId,
					deletedAt: null,
				},
			});

			charUploaderId = originData.character.charUploaderId;

			return {
				success: true,
			};
		});

		if (charUploaderId !== null) {
			updateTag(charactersMyListTag(charUploaderId));
		}

		return result;
	} catch (err) {
		console.error(err);

		/* 같은 코멘트를 두 번 연달아 지우면 늦은 요청이 P2025로 떨어진다. */
		if (err instanceof PrismaClientKnownRequestError && err.code === "P2025") {
			return {
				success: false,
				message: COMMENT_MESSAGE.alreadyDeleted,
			};
		}

		return {
			success: false,
			message: COMMENT_MESSAGE.deleteFailed,
		};
	}
}

export async function hideComment(data: DeleteOrHiddenCommentFormType): Promise<CommentHiddenResult> {
	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return {
			success: false,
			message: COMMENT_MESSAGE.notLoggedIn,
		};
	}

	const userId: string = authInfo.user.id;

	const check = deleteOrHiddenCommentForm.safeParse(data);

	if (!check.success) {
		return {
			success: false,
			message: check.error.issues[0].message,
		};
	}

	const {uuid, commentId} = check.data;

	let hideMode: "hide" | "show" = "hide";

	try {
		const binUuid = uuidToBin(uuid);

		const result: CommentHiddenResult = await db.$transaction(async (t) => {
			const originData = await t.characterComment.findUnique({
				where: {
					character: {
						charPublicLink: binUuid,
					},
					commentId,
					deletedAt: null,
				},
				select: {
					character: {
						select: {
							charUploaderId: true,
							charPublicMode: true,
						},
					},
					userId: true,
					hiddenAt: true,
				},
			});

			if (originData === null) {
				return {
					success: false,
					message: COMMENT_MESSAGE.notFound,
				};
			} else if (originData.character.charPublicMode === PUBLIC_MODE_PRIVATE) {
				return {
					success: false,
					message: COMMENT_MESSAGE.hidePrivate[originData.hiddenAt === null ? "hide" : "show"],
				};
			} else if (originData.character.charUploaderId !== userId) {
				return {
					success: false,
					message: COMMENT_MESSAGE.hideNotUploader[originData.hiddenAt === null ? "hide" : "show"],
				};
			} else if (originData.userId === userId) {
				return {
					success: false,
					message: COMMENT_MESSAGE.hideSelf[originData.hiddenAt === null ? "hide" : "show"],
				};
			}

			hideMode = originData.hiddenAt === null ? "hide" : "show";

			const updatedData = await t.characterComment.update({
				data: {
					hiddenAt: originData.hiddenAt === null ? new Date() : null,
				},
				where: {
					character: {
						charPublicLink: binUuid,
						charPublicMode: {
							not: PUBLIC_MODE_PRIVATE,
						},
					},
					commentId,
					deletedAt: null,
					hiddenAt: originData.hiddenAt === null ? null : {not: null},
				},
			});

			return {
				success: true,
				result: updatedData.hiddenAt !== null ? "hide" : "show",
			};
		});

		return result;
	} catch (err) {
		console.error(err);

		/* 확인과 변경 사이에 작성자가 코멘트를 지우거나, 같은 코멘트에 숨김/표시 요청이 동시에 들어와 hiddenAt이 먼저 바뀌거나,
		   프로필이 비공개로 바뀌면 update가 P2025로 떨어진다. P2025만으로는 셋을 가릴 수 없어 상태가 바뀌었다는 문구로 묶는다. */
		if (err instanceof PrismaClientKnownRequestError && err.code === "P2025") {
			return {
				success: false,
				message: COMMENT_MESSAGE.hideChanged[hideMode],
			};
		}

		return {
			success: false,
			message: COMMENT_MESSAGE.hideFailed[hideMode],
		};
	}
}
