import z from "zod";
import {MUSIC_HOST_PATTERN, MUSIC_PROTOCOL_PATTERN} from "./musicEmbed";
import {IMAGE_ACCEPTED_TYPES, IMAGE_MAX_FILE_SIZE} from "./imageEditor";

/** 한 계정이 만들 수 있는 프로필 수. 업로드 서명과 등록에서 함께 본다. */
export const MAX_TEMPLATE_LIMIT = 10;

/* 항목별 글자 수 상한. 같은 숫자를 생성 폼·AI 초안 폼·AI 응답 스키마·화면 카운터가
   각자 리터럴로 들고 있어서 한 곳만 고치면 나머지가 조용히 어긋났다. 문구에도
   같은 상수를 끼워 넣어 숫자와 안내 문장이 따로 놀지 않게 한다. */
export const CHAR_MAX_LENGTH = {
	charName: 20,
	charMessage: 30,
	charLike: 100,
	charHate: 100,
	charPersonality: 100,
	charKind: 10,
	charAge: 20,
	charBirthday: 10,
	charHeight: 10,
	charBirthplace: 20,
	charMbti: 4,
	charMusic: 255,
} as const;

/** TMI는 글자 수가 아니라 줄 수로 센다 - 한 줄이 항목 하나다. */
export const CHAR_TMI_MAX_LINES = 5;
export const CHAR_TMI_MAX_LINE_LENGTH = 30;

export const createCharForm = z.object({
	charName: z.string().min(1, "캐릭터 이름을 입력해 주세요.").max(CHAR_MAX_LENGTH.charName, `캐릭터 이름을 ${CHAR_MAX_LENGTH.charName}자 이하로 입력해 주세요.`),
	charImage: z
		.instanceof(Blob)
		.nullable()
		.refine((data) => data instanceof Blob, "캐릭터 이미지를 업로드 해주세요."),
	charProfileLayout: z.enum(["h", "v", "s", ""], "이미지 유형을 선택해 주세요.").refine((data) => data === "h" || data === "v" || data === "s", "이미지 유형을 선택해 주세요."),
	charImageFrame: z.enum(["square", "circle", ""], "이미지 프레임을 선택해 주세요.").refine((data) => data === "square" || data === "circle", "이미지 프레임을 선택해 주세요."),
	charMessage: z.string().min(1, "한 줄 소개를 입력해 주세요.").max(CHAR_MAX_LENGTH.charMessage, `한 줄 소개를 ${CHAR_MAX_LENGTH.charMessage}자 이하로 입력해 주세요.`),
	charLike: z.string().max(CHAR_MAX_LENGTH.charLike, `좋아하는 것을 ${CHAR_MAX_LENGTH.charLike}자 이하로 입력해 주세요.`),
	charHate: z.string().max(CHAR_MAX_LENGTH.charHate, `싫어하는 것을 ${CHAR_MAX_LENGTH.charHate}자 이하로 입력해 주세요.`),
	charPersonality: z.string().max(CHAR_MAX_LENGTH.charPersonality, `성격을 ${CHAR_MAX_LENGTH.charPersonality}자 이하로 입력해 주세요.`),
	charTmi: z
		.string()
		.refine((data) => data.split("\n").length <= CHAR_TMI_MAX_LINES, `TMI는 최대 ${CHAR_TMI_MAX_LINES}개까지 입력 할 수 있어요.`)
		.refine((data) => data.split("\n").every((tmi) => tmi.length <= CHAR_TMI_MAX_LINE_LENGTH), `TMI는 각 최대 ${CHAR_TMI_MAX_LINE_LENGTH}자 이하로 입력할 수 있어요.`),
	charKind: z.string().max(CHAR_MAX_LENGTH.charKind, `종족을 ${CHAR_MAX_LENGTH.charKind}자 이하로 입력해 주세요.`),
	charAge: z.string().max(CHAR_MAX_LENGTH.charAge, `나이를 ${CHAR_MAX_LENGTH.charAge}자 이하로 입력해 주세요.`),
	charBirthday: z.string().max(CHAR_MAX_LENGTH.charBirthday, `생일을 ${CHAR_MAX_LENGTH.charBirthday}자 이하로 입력해 주세요.`),
	charHeight: z.string().max(CHAR_MAX_LENGTH.charHeight, `키를 ${CHAR_MAX_LENGTH.charHeight}자 이하로 입력해 주세요.`),
	charBirthplace: z.string().max(CHAR_MAX_LENGTH.charBirthplace, `출생지를 ${CHAR_MAX_LENGTH.charBirthplace}자 이하로 입력해 주세요.`),
	charMbti: z.string().max(CHAR_MAX_LENGTH.charMbti, `MBTI를 ${CHAR_MAX_LENGTH.charMbti}자 이하로 입력해 주세요.`),
	charMusic: z
		.url({
			protocol: MUSIC_PROTOCOL_PATTERN,
			hostname: MUSIC_HOST_PATTERN,
			message: "링크가 유효하지 않아요.",
		})
		.max(CHAR_MAX_LENGTH.charMusic, `테마곡 주소가 너무 길어요. ${CHAR_MAX_LENGTH.charMusic}자 이하로 입력해 주세요.`)
		.or(z.string().refine((data) => data === "")),
	charColor: z
		.string()
		.length(7, "퍼스널 컬러를 입력해 주세요.")
		.regex(/^#[0-9a-f]{6}$/i, "퍼스널 컬러가 올바르지 않아요. HEX로 입력해 주세요."),
	aiUsed: z.enum(["", "0", "1"], "AI 사용 여부를 선택해 주세요.").refine((data) => data === "0" || data === "1", "AI 사용 여부를 선택해 주세요."),
	publicMode: z.enum(["0", "1", "2"], "공개 여부를 선택해 주세요."),
});

export type CreateCharFormType = z.infer<typeof createCharForm>;

/* 서명을 받기 전에 서버가 알아야 하는 값. 어느 버킷에 넣을지는 공개 여부가 정하고,
   크기는 서명에 그대로 박혀 업로드 시점의 상한이 된다. */
export const uploadTicket = z.object({
	publicMode: createCharForm.shape.publicMode,
	size: z.number().int().positive("이미지가 비어 있어요. 다시 올려 주세요.").max(IMAGE_MAX_FILE_SIZE, "이미지 용량은 10MB 이하여야 해요."),
});

export type UploadTicketType = z.infer<typeof uploadTicket>;

/* 이미지 본체는 브라우저가 R2로 곧장 올리므로 서버 액션에는 결과 파일 이름만 넘어온다.
   이름이 서버가 발급한 형식(uuid + .png)인지 확인해야 ../ 같은 조각이 섞여 자기
   경로 밖의 오브젝트를 가리키는 일을 막을 수 있다. */
export const CHAR_IMAGE_NAME_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/;

export const createCharServerForm = createCharForm.omit({charImage: true}).extend({
	charImageName: z.string().regex(CHAR_IMAGE_NAME_PATTERN, "캐릭터 이미지를 다시 업로드 해주세요."),
});

export type CreateCharServerFormType = z.infer<typeof createCharServerForm>;

/* aiUsed는 "선택 안 함"을 빈 문자열로 표현하는데, refine이 붙으면 zod가 출력 타입을
   "0" | "1"로 좁혀 버려서 defaultValues의 빈 문자열을 못 받는다.
   폼이 실제로 들고 있는 값(입력 중)은 이 input 타입, 제출 검증을 통과한 값만 출력 타입. */
export type CreateCharFormInputType = z.input<typeof createCharForm>;

/* 초안 모달이 들고 있는 폼. 규칙은 생성 폼과 같고 "아직 값이 없음"(null)만 더 허용하므로
   shape을 그대로 가져와 .nullable()만 덧댄다 - 같은 제약을 두 번 적으면 한쪽만 고쳐지는 일이 생긴다.
   다른 건 이미지 관련 세 개뿐이다: 여기서는 "선택 안 함"이 빈 문자열이 아니라 null이고,
   charImage는 아직 자르기 전이라 필수가 아니다. */
export const createPromptForm = z.object({
	charName: createCharForm.shape.charName.nullable(),
	charImage: z.instanceof(Blob).nullable(),
	charProfileLayout: z.enum(["h", "v", "s"], "이미지 유형을 선택해 주세요.").nullable(),
	charImageFrame: z.enum(["square", "circle"], "이미지 프레임을 선택해 주세요.").nullable(),
	charMessage: createCharForm.shape.charMessage.nullable(),
	charLike: createCharForm.shape.charLike.nullable(),
	charHate: createCharForm.shape.charHate.nullable(),
	charPersonality: createCharForm.shape.charPersonality.nullable(),
	charTmi: createCharForm.shape.charTmi.nullable(),
	charKind: createCharForm.shape.charKind.nullable(),
	charAge: createCharForm.shape.charAge.nullable(),
	charBirthday: createCharForm.shape.charBirthday.nullable(),
	charHeight: createCharForm.shape.charHeight.nullable(),
	charBirthplace: createCharForm.shape.charBirthplace.nullable(),
	charMbti: createCharForm.shape.charMbti.nullable(),
	charColor: z
		.string()
		.regex(/^#[0-9a-f]{6}$/i, "퍼스널 컬러가 올바르지 않아요. HEX로 입력해 주세요.")
		.nullable(),
});
export const createPromptRequireForm = createPromptForm.required();

export type CreatePromptFormType = z.infer<typeof createPromptForm>;
export type CreatePromptFormRequireType = z.infer<typeof createPromptRequireForm>;

/** AI 초안에 쓰는 캐릭터 설명의 상한. 모달의 카운터도 이 값을 본다. */
export const PROMPT_DESCRIPTION_MAX_LENGTH = 1000;

/** AI 초안을 하루에 쓸 수 있는 횟수. 화면 문구와 서버 차감이 같은 값을 봐야 한다. */
export const AI_DRAFT_DAILY_LIMIT = 10;

/** 남은 횟수가 이 수 이하면 화면에서 눈에 띄게 알린다. */
export const AI_DRAFT_LOW_REMAINING = 3;

/* 다 쓴 뒤의 안내. 서버(횟수를 실제로 막는 쪽)와 화면(미리 알려 주는 쪽)이 같은 문구를
   써야 해서 여기 둔다. 클라이언트 컴포넌트에 두면 서버 액션이 "use client" 모듈을
   들여오게 되고, 그 모듈은 다시 서버 액션을 들여와 순환 참조가 된다. */
export const AI_DRAFT_EXHAUSTED_MESSAGE = "오늘 쓸 수 있는 횟수를 모두 사용했어요. 내일 다시 시도해 주세요.";

/* 하루에 실제로 AI를 부를 수 있는 최대 횟수. 화면에 보이는 한도(AI_DRAFT_DAILY_LIMIT)와
   따로 두는 이유는 환불 때문이다 — 실패한 요청은 횟수를 돌려주므로, 안전 필터에 걸리는
   입력을 반복하면 차감과 환불이 무한히 돌면서 호출만 계속 나간다. 이 상한은 환불해도
   줄지 않아 그 고리를 끊는다.

   정상적으로 쓰면 닿지 않는 수여야 한다. 10회를 다 쓰고 그중 몇 번이 실패해 다시
   시도하는 정도는 지나갈 수 있게 상한의 세 배로 둔다. */
export const AI_DRAFT_DAILY_CALL_LIMIT = AI_DRAFT_DAILY_LIMIT * 3;

/** 연속 호출 사이에 두어야 하는 최소 간격(초). 몰아치는 요청만 막는 값이다. */
export const AI_DRAFT_MIN_CALL_INTERVAL_SECONDS = 3;

/* 한도에 걸렸을 때의 안내. 셋을 나누는 기준은 "사용자가 다음에 뭘 할 수 있는가"다. */
export const AI_DRAFT_CALL_LIMIT_MESSAGE = "오늘은 더 이상 초안을 만들 수 없어요. 내일 다시 시도해 주세요.";
export const AI_DRAFT_TOO_FAST_MESSAGE = "조금 전에 만든 요청이 있어요. 잠시 뒤에 다시 시도해 주세요.";

/* 운영자가 킬 스위치로 껐을 때의 안내. 페이지의 비활성 버튼 옆과 서버 액션 거절
   응답이 같은 문구를 써야 해서 EXHAUSTED_MESSAGE와 같은 이유로 여기 둔다. */
export const AI_DRAFT_DISABLED_MESSAGE = "AI 초안 기능을 잠시 멈춰 두었어요. 프로필은 직접 입력해서 만들 수 있어요.";

/* 초기화 기준은 한국 시간 자정이다. 서버가 어느 지역에서 돌든 경계가 같아야 해서
   시스템 시간대를 쓰지 않고 고정 오프셋으로 계산한다. 한국은 서머타임이 없어
   +9가 연중 고정이라 이 단순한 방식이 성립한다. */
const KST_OFFSET_MILLIS: number = 9 * 60 * 60 * 1000;

/* 한국 시간 기준 "오늘". aiDraftUsedOn은 @db.Date라 시각을 버리고 날짜만 담으므로
   UTC 자정에 맞춘 Date를 넣어야 의도한 날짜가 그대로 저장된다. */
export function getKstToday(): Date {
	const kstNow: Date = new Date(Date.now() + KST_OFFSET_MILLIS);

	return new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()));
}

/* 마지막으로 쓴 날이 오늘이 아니면 자정을 넘긴 것이라, 아직 한 번도 안 쓴 날로 본다.
   크론으로 0시에 전체를 밀지 않아도 되는 이유가 이 한 줄이다. */
export function remainingFrom(usedOn: Date | null, usedCount: number): number {
	if (usedOn === null || usedOn.getTime() !== getKstToday().getTime()) {
		return AI_DRAFT_DAILY_LIMIT;
	}

	return Math.max(0, AI_DRAFT_DAILY_LIMIT - usedCount);
}

/* aihistory.action에 넣을 수 있는 값. "무엇을 했나"만 담고 하이픈을 쓰지 않는다 —
   세부 사유는 아래 AI_HISTORY_REFUND_REASON_LIST로 별도 컬럼에 담는다. 컬럼이 CHAR라
   DB는 아무 문자열이나 받으므로 허용 목록은 여기가 유일한 방어선이다. */
export const AI_HISTORY_ACTION_LIST = ["use", "refund"] as const;

export const aiHistoryAction = z.enum(AI_HISTORY_ACTION_LIST);

export type AiHistoryActionType = z.infer<typeof aiHistoryAction>;

/** aihistory.action 컬럼의 길이. 가장 긴 값("refund")에 맞췄다. */
export const AI_HISTORY_ACTION_MAX_LENGTH = 6;

/* aihistory.reason에 넣을 수 있는 값. action이 "refund"일 때만 채운다("use"는 null).
   Gemini가 돌려준 finishReason을 케밥 소문자로 옮긴 것이 대부분이고, server-error·blocked
   둘만 서버 쪽 사유다. STOP은 성공이라 환불 대상이 아니어서 목록에 없다. */
export const AI_HISTORY_REFUND_REASON_LIST = [
	/* AI를 못 불렀거나(429·5xx) 응답을 해석하지 못한 경우 */
	"server-error",
	/* 보낸 설명이 통째로 거부된 경우(promptFeedback.blockReason) */
	"blocked",
	/* 만들다가 중간에 멈춘 경우(candidates[0].finishReason) */
	"finish-reason-unspecified",
	"max-tokens",
	"safety",
	"recitation",
	"language",
	"other",
	"blocklist",
	"prohibited-content",
	"spii",
	"malformed-function-call",
] as const;

export const aiHistoryRefundReason = z.enum(AI_HISTORY_REFUND_REASON_LIST);

export type AiHistoryRefundReasonType = z.infer<typeof aiHistoryRefundReason>;

/** aihistory.reason 컬럼의 길이. 가장 긴 값("finish-reason-unspecified")에 맞췄다. */
export const AI_HISTORY_REFUND_REASON_MAX_LENGTH = 25;

/* Gemini의 finishReason("MAX_TOKENS")을 reason 값("max-tokens")으로 옮긴다. 목록에
   없는 값이 오면 other로 떨어뜨린다 — 구글이 새 finishReason을 추가했다고 해서 환불
   기록이 실패하면 안 된다. 기록을 못 남기는 것보다 뭉뚱그려 남기는 게 낫다. */
export function toRefundReason(finishReason: string): AiHistoryRefundReasonType {
	const candidate: string = finishReason.toLowerCase().replaceAll("_", "-");
	const check = aiHistoryRefundReason.safeParse(candidate);

	return check.success ? check.data : "other";
}

/* 서버 액션은 폼 컴포넌트를 거치지 않고도 호출할 수 있는 공개 진입점이다. 브라우저에서
   이미 걸러낸 용량·형식이라도 여기서 한 번 더 봐야 한다 - 클라이언트 검사는 편의지 방어가 아니다.
   dimension(3000px) 검사는 이미지를 디코딩해야 알 수 있어 서버에서는 확인하지 않는다.
   용량 상한이 사실상 그 역할을 대신한다. */
export const createPromptActionForm = z
	.object({
		profile: z.string().max(PROMPT_DESCRIPTION_MAX_LENGTH, `캐릭터 설명을 ${PROMPT_DESCRIPTION_MAX_LENGTH}자 이하로 입력해 주세요.`).optional(),
		image: z
			.instanceof(File)
			.refine((file) => file.size > 0, "이미지가 비어 있어요. 다시 올려 주세요.")
			.refine((file) => file.size <= IMAGE_MAX_FILE_SIZE, "이미지 용량은 10MB 이하여야 해요.")
			.refine((file) => IMAGE_ACCEPTED_TYPES.includes(file.type as (typeof IMAGE_ACCEPTED_TYPES)[number]), "PNG, JPG, WEBP 이미지만 사용할 수 있어요.")
			.optional(),
	})
	.refine((data) => Boolean(data.profile?.trim()) || data.image !== undefined, "캐릭터 설명 또는 참고 이미지를 첨부해 주세요.");

export type CreatePromptActionFormType = z.infer<typeof createPromptActionForm>;

/* ── AI 응답 스키마 ────────────────────────────────────────────────────────────
   위쪽 폼 스키마들과 목적이 다르다. 여기는 사람이 채운 입력이 아니라 모델이 만든 JSON을
   받는 자리라 두 가지 규칙이 반대로 간다.

   1) 한국어 에러 메시지를 달지 않는다. 응답 검증 실패는 promptAction이 "분석 중 오류가
      발생했어요" 하나로 뭉쳐 내보내므로 어떤 메시지를 적어도 사용자에게 닿지 않는다.
      그 자리에 .describe()를 둔다 - z.toJSONSchema()를 거쳐 description으로 실려
      모델이 읽는, 항목별 설명의 유일한 통로다.

   2) 상한을 넘긴 값을 버리지 않고 자른다. 응답 하나가 하루 10회 중 1회라 "한 글자
      넘겼으니 전체 실패"는 사용자가 횟수만 잃는 결과다. 자를 수 있는 건 자르고 받는다.

   preprocess로 다듬는 이유도 같다. z.toJSONSchema는 출력(io: "output") 기준이라
   모델에게는 다듬어진 뒤의 모양 - maxLength가 붙은 string - 만 전달된다. */

/** 상한을 넘기면 잘라서 통과시키는 문자열. 앞뒤 공백도 이때 턴다. */
function clippedText(max: number) {
	return z.preprocess((value) => (typeof value === "string" ? value.trim().slice(0, max) : value), z.string().max(max));
}

/** 항목 하나. 근거가 없으면 value가 null, 근거가 약해 뺐으면 reason이 "unverified". */
function draftField(max: number, description: string) {
	return z.object({
		value: clippedText(max).nullable().describe(description),
		reason: z.enum(["unverified"]).optional().describe('근거가 약해 값을 비웠을 때만 "unverified". 애초에 언급이 없던 항목에는 넣지 않는다.'),
	});
}

/** 0~1 비율. 범위를 벗어나면 양 끝으로 당긴다. */
function ratio(description: string) {
	return z.preprocess((value) => (typeof value === "number" ? Math.min(1, Math.max(0, value)) : value), z.number().min(0).max(1)).describe(description);
}

/** 모델은 "#FFF", "#AABBCC " 같은 표기도 곧잘 내놓는다. 여기서 6자리 소문자로 맞춘다. */
const LAYOUT_REASON_MAX_LENGTH = 40;

const draftColor = z
	.preprocess(
		(value) => {
			if (typeof value !== "string") {
				return value;
			}

			const hex: string = value.trim().toLowerCase();
			const shorthand: RegExpMatchArray | null = hex.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);

			return shorthand !== null ? `#${shorthand[1]}${shorthand[1]}${shorthand[2]}${shorthand[2]}${shorthand[3]}${shorthand[3]}` : hex;
		},
		z.string().regex(/^#[0-9a-f]{6}$/),
	)
	.nullable()
	.describe('캐릭터를 대표하는 색 하나를 "#rrggbb" 형식으로. 배경색이 아니라 머리카락·눈·의상 같은 캐릭터 본인의 색에서 고른다. 참고 이미지가 없으면 null.');

export const createPromptResultForm = z.object({
	layout: z
		.object({
			type: z.enum(["h", "v", "s"]).describe('프로필 카드에 어울리는 이미지 유형. "h"=가로로 긴 구도, "v"=세로로 긴 전신, "s"=정사각형(얼굴 위주).'),
			/* 고르는 주체는 사용자다. 모델이 "선택했습니다"로 끝맺으면 화면의 "○○을 추천해요"
			   제목과 어긋나고, 이미 정해진 일처럼 읽힌다. 어미를 문구로 못박아 둔다. */
			reason: clippedText(LAYOUT_REASON_MAX_LENGTH).describe(
				`그 유형을 왜 추천하는지. ${LAYOUT_REASON_MAX_LENGTH}자 이내 한 문장이며 "~추천합니다"로 끝맺는다. "선택했습니다", "정했습니다"처럼 이미 결정된 것처럼 쓰지 않는다.`,
			),
			fx: ratio("잘라도 반드시 남아야 하는 지점(보통 얼굴 중심)의 가로 위치. 이미지 왼쪽 끝이 0, 오른쪽 끝이 1."),
			fy: ratio("같은 지점의 세로 위치. 이미지 위쪽 끝이 0, 아래쪽 끝이 1."),
		})
		.nullable()
		.describe("참고 이미지를 보고 고른 이미지 유형과 초점. 참고 이미지가 없으면 null."),
	color: draftColor,
	fields: z
		.object({
			/* charName도 nullable이다. 이미지만으로 이름을 알 수는 없고, 설명이 있어도
			   이름이 안 적힌 경우가 흔하다. 화면(DraftField)도 value === null을 전제로 그린다. */
			charName: draftField(CHAR_MAX_LENGTH.charName, `캐릭터 이름. ${CHAR_MAX_LENGTH.charName}자 이내.`),
			charMessage: draftField(CHAR_MAX_LENGTH.charMessage, `캐릭터를 한 문장으로 압축한 한 줄 소개. ${CHAR_MAX_LENGTH.charMessage}자 이내.`),
			charLike: draftField(CHAR_MAX_LENGTH.charLike, `좋아하는 것. ${CHAR_MAX_LENGTH.charLike}자 이내.`),
			charHate: draftField(CHAR_MAX_LENGTH.charHate, `싫어하는 것. ${CHAR_MAX_LENGTH.charHate}자 이내.`),
			charPersonality: draftField(CHAR_MAX_LENGTH.charPersonality, `성격. ${CHAR_MAX_LENGTH.charPersonality}자 이내.`),
			/* TMI만 글자 수가 아니라 줄 수로 잘라야 해서 draftField를 쓰지 못한다. */
			charTmi: z.object({
				value: z
					.preprocess((value) => {
						if (typeof value !== "string") {
							return value;
						}

						return value
							.split("\n")
							.slice(0, CHAR_TMI_MAX_LINES)
							.map((line) =>
								line
									.trim()
									/* 지침을 줘도 모델이 습관적으로 붙이는 경우가 있어 방어적으로 한 번 더 뗀다.
									   "..."처럼 의미 있는 말줄임표까지 지우지 않도록 마지막 한 글자만 본다. */
									.replace(/[.]$/, "")
									.slice(0, CHAR_TMI_MAX_LINE_LENGTH),
							)
							.join("\n");
					}, z.string())
					.nullable()
					.describe(
						`다른 항목에 들어가지 않는 나머지 설정을 모으는 칸. 출신, 과거에 있었던 일, 다른 인물과의 관계, 처지, 버릇, 재주 등 무엇이든 넣는다. 사소한 것만 담는 칸이 아니다. 한 줄에 하나씩 줄바꿈으로 구분한다. 최대 ${CHAR_TMI_MAX_LINES}줄, 각 줄 ${CHAR_TMI_MAX_LINE_LENGTH}자 이내. 각 줄은 "~한다", "~좋아한다"처럼 평서형으로 끝맺는다. "~함", "~있음"처럼 명사형으로 끝내지 않는다. 단, 평서형으로 쓰면 글자 수를 넘는 줄은 그 줄만 명사형으로 줄여 쓴다. 줄 끝에 마침표를 붙이지 않는다.`,
					),
				reason: z.enum(["unverified"]).optional(),
			}),
			charKind: draftField(CHAR_MAX_LENGTH.charKind, `종족. ${CHAR_MAX_LENGTH.charKind}자 이내(인간, 반요, 안드로이드 등).`),
			charAge: draftField(CHAR_MAX_LENGTH.charAge, `나이. ${CHAR_MAX_LENGTH.charAge}자 이내. 설명에 쓰인 표기를 그대로 쓴다("열아홉", "19세").`),
			charBirthday: draftField(CHAR_MAX_LENGTH.charBirthday, `생일. ${CHAR_MAX_LENGTH.charBirthday}자 이내("3월 14일").`),
			charHeight: draftField(CHAR_MAX_LENGTH.charHeight, `키. ${CHAR_MAX_LENGTH.charHeight}자 이내("172cm").`),
			charBirthplace: draftField(CHAR_MAX_LENGTH.charBirthplace, `출생지. ${CHAR_MAX_LENGTH.charBirthplace}자 이내.`),
			charMbti: draftField(CHAR_MAX_LENGTH.charMbti, `MBTI ${CHAR_MAX_LENGTH.charMbti}자 대문자("INTJ"). 설명에 직접 적혀 있을 때만 채운다.`),
		})
		.nullable()
		.describe("캐릭터 설명에서 뽑은 항목별 초안. 캐릭터 설명 없이 이미지만 온 요청이면 null."),
});

export type CreatePromptResultFormType = z.infer<typeof createPromptResultForm>;

/** 항목별 결과 한 칸. 결과 화면이 이 타입을 그대로 쓴다. */
export type CreatePromptResultFieldType = NonNullable<CreatePromptResultFormType["fields"]>[keyof NonNullable<CreatePromptResultFormType["fields"]>];
