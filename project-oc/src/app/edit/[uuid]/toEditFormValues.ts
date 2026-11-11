import type {CreateCharFormInputType} from "@/app/create/validator";
import type {GetCharacterAsRowsResult} from "@/app/template/[uuid]/getCharacter";

type ProfileLayoutInput = CreateCharFormInputType["charProfileLayout"];
type ImageFrameInput = CreateCharFormInputType["charImageFrame"];
type AiUsedInput = CreateCharFormInputType["aiUsed"];
type PublicModeInput = CreateCharFormInputType["publicMode"];

export interface ToEditFormValues extends Omit<CreateCharFormInputType, "charImage"> {
	charImage: string;
}

const PROFILE_LAYOUTS: readonly ProfileLayoutInput[] = ["h", "v", "s"];
const IMAGE_FRAMES: readonly ImageFrameInput[] = ["square", "circle"];
const AI_USED: readonly AiUsedInput[] = ["0", "1"];
const PUBLIC_MODES: readonly PublicModeInput[] = ["0", "1", "2"];

/* DB 컬럼은 CHAR, TINYINT라 폼의 선택지 밖 값이 들어 있을 수 있다. as로 단언하면 그 값이
   그대로 폼에 들어가므로 선택지 안에서 찾고, 없으면 "선택하지 않음"("")으로 둬서
   제출 때 검증에 걸리게 한다. 조회 페이지(getCharacter)처럼 기본값으로 떨어뜨리지 않는 건,
   수정 화면에서는 틀린 값을 사용자가 모른 채 저장하게 되기 때문이다. */
function pick<T extends string>(options: readonly T[], raw: string, empty: T): T {
	return options.find((option) => option === raw) ?? empty;
}

/* TMI는 Json 컬럼이라 배열이 아닐 수 있다. 폼은 줄바꿈으로 나눈 문자열 하나로 받는다. */
function toTmiText(raw: unknown): string {
	return Array.isArray(raw) ? raw.filter((line): line is string => typeof line === "string").join("\n") : "";
}

/** DB 행을 수정 폼의 defaultValues로 바꾼다. 이미지는 새로 올릴 때만 값이 생기므로 null로 둔다. */
export function toEditFormValues(character: GetCharacterAsRowsResult): ToEditFormValues {
	return {
		charName: character.charName,
		charImage: character.charImage,
		charProfileLayout: pick(PROFILE_LAYOUTS, character.charProfileLayout, ""),
		charImageFrame: pick(IMAGE_FRAMES, character.charImageFrame, ""),
		charMessage: character.charMessage,
		charLike: character.charLike ?? "",
		charHate: character.charHate ?? "",
		charPersonality: character.charPersonality ?? "",
		charTmi: toTmiText(character.charTmi),
		charKind: character.charKind ?? "",
		charAge: character.charAge ?? "",
		charBirthday: character.charBirthday ?? "",
		charHeight: character.charHeight ?? "",
		charBirthplace: character.charBirthplace ?? "",
		charMbti: character.charMbti ?? "",
		charMusic: character.charMusic ?? "",
		charColor: character.charColor,
		aiUsed: pick(AI_USED, String(character.aiUsed), ""),
		publicMode: pick(PUBLIC_MODES, String(character.charPublicMode), "2"),
	};
}
