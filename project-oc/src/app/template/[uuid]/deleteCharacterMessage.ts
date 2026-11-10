/* deleteCharacter.ts는 "use server" 파일이라 async 함수만 export할 수 있다.
   테스트에서 메시지를 비교하려고 commentMessage.ts처럼 밖으로 꺼내 둔다. */
export const DELETE_CHARACTER_MESSAGE = {
	invalidUuid: "올바른 캐릭터 프로필이 아니에요.",
	notLoggedIn: "로그인이 안 되어 있어요. 로그인 후 이용해 주세요.",
	notFound: "없거나 이미 삭제된 프로필이에요.",
	notOwner: "본인이 제작한 프로필만 삭제할 수 있어요.",
	alreadyDeleted: "이미 삭제된 프로필이에요.",
	failed: "프로필 삭제에 실패했어요. 잠시 후 다시 시도해 주세요.",
} as const;
