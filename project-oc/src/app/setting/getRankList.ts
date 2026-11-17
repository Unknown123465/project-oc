import {auth} from "@/auth/auth";
import {SettingActivity} from "./validator";
import db from "@/prisma/client";
import {binToUuid} from "@/prisma/uuid";

type FailureReason = "notLoggedIn";

interface GetRankListSuccessResult {
	success: true;
	result: SettingActivity;
}

interface GetRankListFailureResult {
	success: false;
	reason: FailureReason;
}

type GetRankListResult = GetRankListSuccessResult | GetRankListFailureResult;

export async function getMyRankList(): Promise<GetRankListResult> {
	const authInfo = await auth();

	if (authInfo === null || !authInfo.user?.id) {
		return {
			success: false,
			reason: "notLoggedIn",
		};
	}

	const userId: string = authInfo.user.id;

	const [totalProfile, totalLike, totalComment, likeTop5, commentTop5OnlyId] = await Promise.all([
		db.character.count({
			where: {
				charUploaderId: userId,
			},
		}),
		db.characterLike.count({
			where: {
				character: {
					charUploaderId: userId,
				},
			},
		}),
		db.characterComment.count({
			where: {
				deletedAt: null,
				character: {
					charUploaderId: userId,
				},
			},
		}),
		db.character.findMany({
			where: {
				charUploaderId: userId,
				characterLikes: {
					some: {},
				},
			},
			select: {
				charPublicLink: true,
				charName: true,
				_count: {
					select: {
						characterLikes: true,
					},
				},
			},
			orderBy: [
				{
					characterLikes: {
						_count: "desc",
					},
				},
				{charId: "desc"},
			],
			take: 5,
		}),
		db.characterComment.groupBy({
			where: {
				character: {
					charUploaderId: userId,
				},
				deletedAt: null,
			},
			_count: {
				commentId: true,
			},
			by: ["charId"],
			orderBy: [
				{
					_count: {
						commentId: "desc",
					},
				},
				{
					charId: "desc",
				},
			],
			take: 5,
		}),
	]);

	const commentTop5 = await db.character.findMany({
		where: {
			charId: {
				in: commentTop5OnlyId.map(({charId}) => charId),
			},
		},
		select: {
			charId: true,
			charPublicLink: true,
			charName: true,
		},
	});

	return {
		success: true,
		result: {
			profileCount: totalProfile,
			likeCount: totalLike,
			commentCount: totalComment,
			likeTop: likeTop5.map((list) => ({
				name: list.charName,
				count: list._count.characterLikes,
				uuid: binToUuid(list.charPublicLink),
			})),
			commentTop: commentTop5OnlyId
				.map((list) => {
					const profile = commentTop5.find((data) => data.charId === list.charId);

					return {
						name: profile?.charName ?? "알 수 없음",
						count: list._count.commentId,
						uuid: profile ? binToUuid(profile.charPublicLink) : "notFound",
					};
				})
				.filter((list) => list.uuid !== "notFound"),
		},
	};
}
