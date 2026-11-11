/* action.ts는 "use server" 파일이라 async 함수만 export할 수 있다.
   테스트에서 메시지를 비교하려고 deleteCharacterMessage.ts처럼 밖으로 꺼내 둔다.
   validator.ts도 이 파일을 쓰므로 validator.ts를 import하면 순환 import가 된다. 그래서 상한은 인자로 받는다. */
export const CHAR_ACTION_MESSAGE = {
	invalidUuid: "올바른 프로필이 아니에요.",
	notLoggedIn: "로그인이 안 되어 있어요. 로그인 후 이용해 주세요.",
	userNotFound: "접속한 계정 정보를 찾을 수 없어요.",
	limitExceeded: (max: number): string => `더 이상 프로필을 만들 수 없어요. 프로필은 최대 ${max}개까지 만들 수 있어요.`,
	notFound: "수정할 프로필을 찾을 수 없어요.",
	notOwner: "본인이 만든 프로필만 수정할 수 있어요.",
	layoutChangeWithoutImage: "이미지 유형이나 프레임을 바꾸려면 이미지를 새로 올려 주세요.",
	imageInUse: "이미 사용 중인 이미지예요. 이미지를 다시 올려 주세요.",
	imageNotUploaded: "이미지 업로드가 확인되지 않았어요. 이미지를 다시 올려 주세요.",
	imageInvalid: "이미지가 올바르지 않아요. 이미지를 다시 올려 주세요.",
	uploadPrepareFailed: "이미지 업로드를 준비하지 못했어요. 잠시 후 다시 시도해 주세요.",
	createFailed: "프로필 등록에 실패했어요. 다시 시도해 주세요.",
	editFailed: "프로필 수정에 실패했어요. 다시 시도해 주세요.",
} as const;
