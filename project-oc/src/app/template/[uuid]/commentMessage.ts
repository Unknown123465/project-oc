/* comment.ts는 "use server" 파일이라 async 함수만 export할 수 있다. 테스트에서 메시지를
   비교하려면 문자열을 밖으로 꺼내야 해서 여기 모아 둔다. 숨김 관련은 숨길 때와 표시할 때
   문구가 달라 hide, show 둘로 나눈다(키는 hideComment의 result와 같다). */
export const COMMENT_MESSAGE = {
	notLoggedIn: "로그인이 안 되어 있어요. 로그인 후 이용해 주세요.",
	profileNotFound: "프로필이 존재하지 않아요.",
	notFound: "프로필 또는 코멘트가 존재하지 않아요.",

	writeTooFast: "작성 요청이 너무 빈번해요. 잠시 뒤에 다시 시도해 주세요.",
	writePrivate: "비공개 프로필에 코멘트를 작성할 수 없어요.",
	writeTargetGone: "프로필이 삭제됐거나 탈퇴한 계정이에요.",
	writeFailed: "코멘트 작성에 실패했어요. 다시 시도해 주세요.",

	editTooFast: "수정 요청이 너무 빈번해요. 잠시 뒤에 다시 시도해 주세요.",
	editNotOwner: "본인이 작성한 코멘트만 수정할 수 있어요.",
	editPrivate: "비공개 프로필의 코멘트는 수정할 수 없어요.",
	editFailed: "코멘트 수정에 실패했어요. 다시 시도해 주세요.",

	deleteNotOwner: "본인이 작성한 코멘트만 삭제할 수 있어요.",
	deletePrivate: "비공개 프로필의 코멘트는 삭제할 수 없어요.",
	alreadyDeleted: "이미 삭제된 코멘트예요.",
	deleteFailed: "코멘트 삭제에 실패했어요. 다시 시도해 주세요.",

	/* 키는 judgeCommentScore의 highestScoreType과 같다. 성적, 고어는 거부하지 않아 없다. */
	deny: {
		spamScore: "스팸으로 보이는 코멘트는 남길 수 없어요.",
		mockeryScore: "프로필을 심하게 조롱하거나 비하하는 코멘트는 남길 수 없어요.",
		ownerAttackScore: "프로필 제작자를 공격하는 코멘트는 남길 수 없어요.",
		userAttackScore: "다른 사람을 공격하는 코멘트는 남길 수 없어요.",
	},

	hideNotUploader: {
		hide: "본인이 제작한 프로필의 코멘트만 숨길 수 있어요.",
		show: "본인이 제작한 프로필의 코멘트만 표시할 수 있어요.",
	},
	hideSelf: {
		hide: "본인의 코멘트를 숨길 수 없어요.",
		show: "본인의 코멘트를 표시할 수 없어요.",
	},
	hidePrivate: {
		hide: "비공개 프로필의 코멘트를 숨길 수 없어요.",
		show: "비공개 프로필의 코멘트를 표시할 수 없어요.",
	},
	hideChanged: {
		hide: "그사이 코멘트 상태가 바뀌어 숨기지 못했어요. 새로고침한 뒤 확인해 주세요.",
		show: "그사이 코멘트 상태가 바뀌어 표시하지 못했어요. 새로고침한 뒤 확인해 주세요.",
	},
	hideFailed: {
		hide: "코멘트를 숨기는 데 실패했어요. 다시 시도해 주세요.",
		show: "코멘트를 표시하는 데 실패했어요. 다시 시도해 주세요.",
	},
} as const;

export interface Comment {
	commentId: string;
	userName: string;
	charComment: string;
	createdAt: Date;
	updated: boolean;
	hidden: boolean;
}

export interface CommentFromTemplate extends Comment {
	isMine: boolean;
	blinded: boolean;
}
