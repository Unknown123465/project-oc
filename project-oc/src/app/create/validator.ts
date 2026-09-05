import z from "zod";

export const createCharForm = z.object({
	charName: z.string().min(1, "캐릭터 이름을 입력해 주세요.").max(20, "캐릭터 이름을 20자 이하로 입력해 주세요."),
	charImage: z
		.instanceof(Blob)
		.nullable()
		.refine((data) => data instanceof Blob, "캐릭터 이미지를 업로드 해주세요."),
	charProfileLayout: z.enum(["h", "v", "s", ""], "이미지 유형을 선택해 주세요.").refine((data) => data === "h" || data === "v" || data === "s", "이미지 유형을 선택해 주세요."),
	charImageFrame: z.enum(["square", "circle", ""], "이미지 프레임을 선택해 주세요.").refine((data) => data === "square" || data === "circle", "이미지 프레임을 선택해 주세요."),
	charMessage: z.string().min(1, "한 줄 소개를 입력해 주세요.").max(30, "한 줄 소개를 30자 이하로 입력해 주세요."),
	charLike: z.string().max(100, "좋아하는 것을 100자 이하로 입력해 주세요."),
	charHate: z.string().max(100, "싫어하는 것을 100자 이하로 입력해 주세요."),
	charPersonality: z.string().max(100, "성격을 100자 이하로 입력해 주세요."),
	charTmi: z
		.string()
		.refine((data) => data.split("\n").length <= 5, "TMI는 최대 5개까지 입력 할 수 있어요.")
		.refine((data) => data.split("\n").every((tmi) => tmi.length <= 30), "TMI는 각 최대 30자 이하로 입력할 수 있어요."),
	charKind: z.string().max(10, "종족을 10자 이하로 입력해 주세요."),
	charAge: z.string().max(20, "나이를 20자 이하로 입력해 주세요."),
	charBirthday: z.string().max(10, "생일을 10자 이하로 입력해 주세요."),
	charHeight: z.string().max(10, "키를 10자 이하로 입력해 주세요."),
	charBirthplace: z.string().max(20, "출생지를 20자 이하로 입력해 주세요."),
	charMbti: z.string().max(4, "MBTI를 4자 이하로 입력해 주세요."),
	charMusic: z
		.url({
			protocol: /^https$/,
			hostname: /^((m\.)?youtube\.com|youtu\.be|open\.spotify\.com|soundcloud\.com)/,
			message: "링크가 유효하지 않아요.",
		})
		.max(255, "테마곡 주소가 너무 길어요. 255자 이하로 입력해 주세요.")
		.or(z.string().refine((data) => data === "")),
	charColor: z
		.string()
		.length(7, "퍼스널 컬러를 입력해 주세요.")
		.regex(/^#[0-9a-f]{6}$/i, "퍼스널 컬러가 올바르지 않아요. HEX로 입력해 주세요."),
	aiUsed: z.enum(["", "0", "1"], "AI 사용 여부를 선택해 주세요.").refine((data) => data === "0" || data === "1", "AI 사용 여부를 선택해 주세요."),
	publicMode: z.enum(["0", "1", "2"], "공개 여부를 선택해 주세요."),
});

export type CreateCharFormType = z.infer<typeof createCharForm>;

/* aiUsed는 "선택 안 함"을 빈 문자열로 표현하는데, refine이 붙으면 zod가 출력 타입을
   "0" | "1"로 좁혀 버려서 defaultValues의 빈 문자열을 못 받는다.
   폼이 실제로 들고 있는 값(입력 중)은 이 input 타입, 제출 검증을 통과한 값만 출력 타입. */
export type CreateCharFormInputType = z.input<typeof createCharForm>;
