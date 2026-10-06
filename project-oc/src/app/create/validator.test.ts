import {describe, expect, it} from "vitest";
import {createCharForm, createCharServerForm, uploadTicket, MAX_TEMPLATE_LIMIT, createPromptForm, ALL_CHAR_MAX_LENGTH} from "./validator";
import {IMAGE_MAX_FILE_SIZE} from "./imageEditor";

/* 이 스키마는 브라우저의 폼 검증과 서버 액션의 재검증을 동시에 맡는다. 즉 여기가
   느슨해지면 화면에서 막히는 값이 서버에서는 통과한다. 경계값과 "막아야 하는 값"만
   확인하고, 잘 되는 경우를 나열하지는 않는다. */

const field = createCharForm.shape;
const promptField = createPromptForm.shape;

/** 서버 검증기가 요구하는 최소 형태. 필드 하나씩 덮어써서 쓴다. */
function serverFormFixture(override: Record<string, unknown> = {}) {
	return {
		charName: "이름",
		charImageName: "0f8fad5b-d9cb-469f-a165-70867728950e.png",
		charProfileLayout: "s",
		charImageFrame: "circle",
		charMessage: "한 줄 소개",
		charLike: "",
		charHate: "",
		charPersonality: "",
		charTmi: "",
		charKind: "",
		charAge: "",
		charBirthday: "",
		charHeight: "",
		charBirthplace: "",
		charMbti: "",
		charMusic: "",
		charColor: "#ffc90e",
		aiUsed: "0",
		publicMode: "0",
		...override,
	};
}

describe("글자 수 제한", () => {
	/* 컬럼 길이와 어긋나면 INSERT가 터진다. 제한은 공백 "포함"이다 - 목업의
	   공백 제외 계산(data-nonspace-max)을 따라가면 안 되는 지점. */
	it.each([
		["charName", 20],
		["charMessage", 30],
		["charLike", 100],
		["charHate", 100],
		["charPersonality", 100],
		["charKind", 10],
		["charAge", 20],
		["charBirthday", 10],
		["charHeight", 10],
		["charBirthplace", 20],
		["charMbti", 4],
	] as const)("%s은(는) %i자까지만 받는다", (name, max) => {
		const schema = field[name];

		expect(schema.safeParse("가".repeat(max)).success).toBe(true);
		expect(schema.safeParse("가".repeat(max + 1)).success).toBe(false);
	});

	it("공백도 한 글자로 센다", () => {
		expect(field.charLike.safeParse(" ".repeat(5) + "테스트" + " ".repeat(101) + "1" + " ".repeat(5)).success).toBe(false);
	});
});

describe("공백 체크", () => {
	const requireFieldNameList = ["charName", "charMessage"] as const;
	const optionalFieldNameList = ["charLike", "charHate", "charPersonality", "charKind", "charAge", "charBirthday", "charHeight", "charBirthplace", "charMbti"] as const;
	const fieldNameList = [...requireFieldNameList, ...optionalFieldNameList, "charTmi"] as const;

	describe.each(fieldNameList)("요소 %s 최대 상한 테스트", (name) => {
		it(`모든 요소는 ${ALL_CHAR_MAX_LENGTH}자를 초과하면 통과되지 말아야 한다`, () => {
			const schema = field[name];

			const transparentChars: string = " ".repeat(ALL_CHAR_MAX_LENGTH / 2 - 1);
			const normalChars: string = "가".repeat(4);

			const inputChars: string = transparentChars + normalChars + transparentChars;

			expect(schema.safeParse(inputChars).success).toBe(false);
		});
	});

	describe("요소 charMusic 최대 상한 테스트", () => {
		it(`테마곡은 ${ALL_CHAR_MAX_LENGTH}자를 초과하면 통과되지 말아야 한다`, () => {
			const schema = field.charMusic;

			const transparentChars: string = " ".repeat(ALL_CHAR_MAX_LENGTH / 2 - 1);
			const url: string = "https://soundcloud.com/artist/track";

			const inputChars: string = transparentChars + url + transparentChars;

			expect(schema.safeParse(inputChars).success).toBe(false);
		});
	});

	describe.each(requireFieldNameList)("필수 요소 %s", (name) => {
		it("일반 공백 입력 시 통과되지 말아야 한다", () => {
			const schema = field[name];

			expect(schema.safeParse(" ".repeat(15)).success).toBe(false);
		});

		it("일반 공백 입력 시 createPromptForm에서 통과되지 말아야 한다", () => {
			const schema = promptField[name];

			expect(schema.safeParse(" ".repeat(15)).success).toBe(false);
		});

		it("보이지 않는 문자 20개, 일반 글자 15개를 입력해도 통과되어야 하며, 일반 문자만 반환해야 한다", () => {
			const schema = field[name];

			const transparentChars: string = "\u200b".repeat(10);
			const normalChars: string = "가".repeat(15);

			const inputChars: string = transparentChars + normalChars + transparentChars;

			const check = schema.safeParse(inputChars);

			expect(check.success).toBe(true);
			expect(check.data).toBe(normalChars);
		});

		it.each([
			["일반 공백", " ".repeat(4)],
			["특수 공백", "\u115f\u1160\u3164"],
			["ZWJ", "\u200d"],
			["변형 선택자", "\ufe0f"],
		])("서버에 %s만 넣을 시 필수 요소는 통과되지 말아야 한다", (_, value) => {
			const requireOverrideForm = serverFormFixture({
				[name]: value,
			});

			expect(createCharServerForm.safeParse(requireOverrideForm).success).toBe(false);
		});

		it.each([
			["좌측", "   테스트"],
			["우측", "테스트    "],
			["양측", "   테스트   "],
		])("%s에 일반 공백과 문자를 섞으면 통과되어야 한다", (_, value) => {
			const schema = field[name];

			const check = schema.safeParse(value);

			expect(check.success).toBe(true);
			expect(check.data).toBe("테스트");
		});

		it.each([
			["일반 공백", "테스   트"],
			["특수 공백", "테\u115f\u1160\u3164스트"],
			["ZWJ", "테\u200d\u200d스트"],
			["변형 선택자", "테스\ufe0f\ufe0f트"],
		])("%s을(를) 중간에 입력해도 지워지지 않는다", (_, value) => {
			expect(field[name].safeParse(value).data).toBe(value);
		});

		it.each([
			["연속 특수 공백", "\u200b\u200c\u2060\u115f\u1160\u3164\uffa0\ufe0f"],
			["오직 ZWJ만", "\u200d"],
			["3연속 ZWJ를", "\u200d\u200d\u200d"],
			["오직 변형 선택자만", "\ufe0f"],
			["3연속 변형 선택자를", "\ufe0f\ufe0f\ufe0f"],
			["ZWJ와 변형 선택자를 섞은 채", "\ufe0f\u200d"],
		])("%s 입력하면 통과되지 말아야 한다", (_, value) => {
			expect(field[name].safeParse(value).success).toBe(false);
		});

		it("ZWJ 좌우에 이모지가 있으면 통과되어야 한다", () => {
			const check = field[name].safeParse("👨\u200D🚀");

			expect(check.success).toBe(true);
			expect(check.data).toBe("👨‍🚀");
		});

		it.each([
			["ZWJ + 특수 공백 + ZWJ", "\u200d\u200c\u200d"],
			["ZWJ + 특수 공백", "\u200d\u2060"],
			["특수 공백 + ZWJ", "\u3164\u200d"],
			["ZWJ + 일반 공백 + ZWJ", "\u200d  \u200d"],
			["ZWJ + 일반 공백", "\u200d "],
			["일반 공백 + ZWJ", "  \u200d"],
			["일반 공백 + ZWJ + 일반 공백", " \u200d "],
			["특수 공백 + ZWJ + 특수 공백", "\u200c\u200d\u200c"],
			["변형 선택자 + ZWJ + 변형 선택자", "\ufe0f\u200d\ufe0f"],
			["변형 선택자 + 일반 공백 + 변형 선택자", "\ufe0f   \ufe0f"],
			["변형 선택자 + 특수 공백 + 변형 선택자", "\ufe0f\u3164\ufe0f"],
		])("%s 조합은 통과되지 말아야 한다", (_, value) => {
			expect(field[name].safeParse(value).success).toBe(false);
		});

		it.each([
			["이모지", "🚀"],
			["일반 글자", "가"],
		])("ZWJ + %s + ZWJ 조합이면 통과되어야 하고, '%s'만 반환해야 한다", (_, value) => {
			const check = field[name].safeParse(`\u200d${value}\u200d`);

			expect(check.success).toBe(true);
			expect(check.data).toBe(value);
		});

		it.each([
			["ZWJ + 이모지", "\u200d👨"],
			["이모지 + ZWJ", "👨\u200d"],
		])("%s 조합으로 입력해도 통과는 하되, 이모지만 반환해야 한다", (_, value) => {
			const check = field[name].safeParse(value);

			expect(check.success).toBe(true);
			expect(check.data).toBe("👨");
		});

		it("텍스트 뒤에 변형 선택자가 있으면 통과되어야 한다", () => {
			const check = field[name].safeParse("♥\ufe0f");

			expect(check.success).toBe(true);
			expect(check.data).toBe("♥️");
		});

		it.each([
			["🏳\ufe0f\u200d🌈", "🏳️‍🌈"],
			["❤\ufe0f\u200d🔥", "❤️‍🔥"],
		])("이모지 + 변형 선택자 + ZWJ + 이모지 조합을 할 때 변형 선택자, ZWJ가 지워지지 말아야 하며, 하나의 이모지로 합쳐진 것과 같아야 한다", (union, result) => {
			expect(field[name].safeParse(union).data).toBe(result);
		});
	});

	describe.each(optionalFieldNameList)("선택 요소 %s", (name) => {
		it("보이지 않는 문자 10개, 일반 문자 4개를 입력해도 통과되어야 하며, 일반 문자만 반환해야 한다", () => {
			const schema = field[name];

			const transparentChars: string = "\u200b".repeat(5);
			const normalChars: string = "A".repeat(4);

			const inputChars: string = transparentChars + normalChars + transparentChars;

			const check = schema.safeParse(inputChars);

			expect(check.success).toBe(true);
			expect(check.data).toBe(normalChars);
		});

		it("일반 공백 입력 시 통과되고 빈 문자열로 반환되어야 한다", () => {
			const schema = field[name];

			const check = schema.safeParse(" ".repeat(4));

			expect(check.success).toBe(true);
			expect(check.data).toBe("");
		});

		it.each([
			["일반 공백", " ".repeat(4)],
			["특수 공백", "\u115f\u1160\u3164"],
			["ZWJ", "\u200d"],
			["변형 선택자", "\ufe0f"],
		])("서버에 %s만 넣을 시 통과하되, 빈 문자열로 반환되어야 한다", (_, value) => {
			const optionalOverrideForm = serverFormFixture({
				[name]: value,
			});

			const optionalCheck = createCharServerForm.safeParse(optionalOverrideForm);

			expect(optionalCheck.success).toBe(true);
			expect(optionalCheck.data?.[name]).toBe("");
		});
	});

	describe("TMI", () => {
		it("항목 5개에 빈 줄이 섞여도 통과되어야 한다", () => {
			const tmiList: string[] = ["", "테스트1", "테스트2", "", "테스트3", "테스트4", "테스트5", ""];

			expect(field.charTmi.safeParse(tmiList.join("\n")).data).toBe("테스트1\n테스트2\n테스트3\n테스트4\n테스트5");
		});

		it.each([
			["줄 좌우 일반 공백", ["    테스트1", "테스트2    ", "     테스트3      "]],
			["줄 좌우 특수 공백, ZWJ", ["\u200b\u200c\u2060\u115f테스트1", "\u200d\u200d테스트2", "\u200b테스트3\u115f\u1160"]],
		])("%s(으)로 넣으면 지워져야 한다", (_, value) => {
			expect(field.charTmi.safeParse(value.join("\n")).data).toBe("테스트1\n테스트2\n테스트3");
		});

		it("한 줄을 보이지 않는 문자 20개, 일반 글자 20개로 입력해도 통과되어야 하며, 일반 문자만 반환해야 한다", () => {
			const transparentChars: string = "\u200b".repeat(10);
			const normalChars: string = "가".repeat(20);

			const inputChars: string = transparentChars + normalChars + transparentChars;

			const check = field.charTmi.safeParse(inputChars);

			expect(check.success).toBe(true);
			expect(check.data).toBe(normalChars);
		});

		it.each([
			["일반 공백", [" ".repeat(7), "   테스트   ", " ".repeat(10)]],
			["특수 공백", ["\u200b", "\u200b\u200b테스트\u200b\u200b", "\u200b"]],
			["ZWJ", ["\u200d", "\u200d\u200d테스트\u200d", "\u200d"]],
			["일반 공백 + 특수 공백 + ZWJ", ["\u200d", "\u200b테스트", " ".repeat(5)]],
		])("각 줄에 %s 조합으로 입력 시 해당 줄의 공백을 지움. 만약 지웠는데 빈 줄이면 해당 줄은 삭제", (_, value) => {
			const check = field.charTmi.safeParse(value.join("\n"));

			expect(check.success).toBe(true);
			expect(check.data).toBe("테스트");
		});
	});

	describe("테마곡", () => {
		it.each([
			["특수 공백", "https://youtu.be/dQw4w9WgXcQ", "\u200b\u200c\u2060\u115f"],
			["일반 공백 + 특수 공백", "https://open.spotify.com/track/abc", "\u2060\u115f" + " ".repeat(5)],
		])("URL 좌우에 %s을 입력하면 통과되어야 하며, 해당 공백을 지우고 입력한 URL만 반환해야 한다", (_, url, blank) => {
			const value: string = blank + url + blank;

			const check = field.charMusic.safeParse(value);

			expect(check.success).toBe(true);
			expect(check.data).toBe(url);
		});

		it.each([
			["일반 공백", " ".repeat(10)],
			["특수 공백", "\u200b\u200c\u2060\u115f"],
			["일반 공백 + 특수 공백", "\u2060\u115f" + " ".repeat(5)],
		])("%s만 입력하면 통과되어야 하고, 빈 문자열을 반환해야 한다", (_, value) => {
			const check = field.charMusic.safeParse(value);

			expect(check.success).toBe(true);
			expect(check.data).toBe("");
		});
	});
});

describe("필수 입력", () => {
	it("이름과 한 줄 소개는 비워 둘 수 없다", () => {
		expect(field.charName.safeParse("").success).toBe(false);
		expect(field.charMessage.safeParse("").success).toBe(false);
	});

	/* "" 는 라디오/셀렉트의 미선택 상태다. 타입상 존재하는 값이라 refine이 없으면
	   그대로 통과해 DB에 빈 값이 들어간다. */
	it.each(["charProfileLayout", "charImageFrame", "aiUsed"] as const)("%s의 미선택 상태는 통과하지 않는다", (name) => {
		expect(field[name].safeParse("").success).toBe(false);
	});

	it("선택 정보는 비어 있어도 된다", () => {
		expect(field.charLike.safeParse("").success).toBe(true);
		expect(field.charMusic.safeParse("").success).toBe(true);
	});
});

describe("퍼스널 컬러", () => {
	it("HEX 6자리만 받는다", () => {
		expect(field.charColor.safeParse("#ffc90e").success).toBe(true);
		expect(field.charColor.safeParse("#FFC90E").success).toBe(true);
	});

	it.each([
		["ffc90e", "# 없음"],
		["#ffc90", "5자리"],
		["#gggggg", "16진수 아님"],
		["#ffc90ee", "7자리"],
		["red", "색 이름"],
	])("%s 는 거부한다 (%s)", (value) => {
		expect(field.charColor.safeParse(value).success).toBe(false);
	});
});

describe("테마곡 주소", () => {
	it("지원 서비스는 통과한다", () => {
		expect(field.charMusic.safeParse("https://www.youtube.com/watch?v=dQw4w9WgXcQ").success).toBe(true);
		expect(field.charMusic.safeParse("https://youtu.be/dQw4w9WgXcQ").success).toBe(true);
		expect(field.charMusic.safeParse("https://open.spotify.com/track/abc").success).toBe(true);
		expect(field.charMusic.safeParse("https://soundcloud.com/artist/track").success).toBe(true);
	});

	/* iframe으로 남의 사이트를 우리 페이지 안에서 실행시키는 값이라 호스트를
	   목록으로 잠근다. 아래가 뚫리면 CSP frame-src만 남고 검증은 무의미해진다. */
	it.each([
		["https://youtube.com.evil.com/watch?v=1", "접미사 사칭"],
		["https://evil.com/youtube.com", "경로에만 서비스명"],
		["https://youtubeXcom/watch?v=1", "정규식 점이 와일드카드로 새는지"],
		["https://notyoutube.com/watch?v=1", "접두사 사칭"],
		["http://www.youtube.com/watch?v=1", "평문 http"],
		["javascript:alert(1)", "스크립트 스킴"],
	])("%s 는 거부한다 (%s)", (url) => {
		expect(field.charMusic.safeParse(url).success).toBe(false);
	});
});

describe("TMI", () => {
	it("최대 5줄까지 받는다", () => {
		expect(field.charTmi.safeParse(Array(5).fill("tmi").join("\n")).success).toBe(true);
		expect(field.charTmi.safeParse(Array(6).fill("tmi").join("\n")).success).toBe(false);
	});

	it("각 줄은 30자까지다", () => {
		expect(field.charTmi.safeParse("가".repeat(30)).success).toBe(true);
		expect(field.charTmi.safeParse(`짧은 줄\n${"가".repeat(31)}`).success).toBe(false);
	});
});

describe("서버 검증기 - 이미지 파일명", () => {
	/* 이미지 본체는 브라우저가 R2로 직접 올리고 서버에는 이름만 온다. 이름이 곧
	   오브젝트 키의 일부라, 여기가 뚫리면 자기 경로 밖의 오브젝트를 가리킬 수 있다. */
	it("서버가 발급한 형식(uuid.png)만 받는다", () => {
		expect(createCharServerForm.safeParse(serverFormFixture()).success).toBe(true);
	});

	it.each([
		["../../etc/passwd.png", "상위 경로 이동"],
		["../0f8fad5b-d9cb-469f-a165-70867728950e.png", "uuid 앞에 상위 경로"],
		["0f8fad5b-d9cb-469f-a165-70867728950e.jpg", "png 아닌 확장자"],
		["0f8fad5b-d9cb-469f-a165-70867728950e", "확장자 없음"],
		["tmp/0f8fad5b-d9cb-469f-a165-70867728950e.png", "경로 구분자 포함"],
		["0f8fad5b-d9cb-469f-a165-70867728950e.png\n", "개행 덧붙임"],
		["not-a-uuid.png", "uuid 아님"],
		["", "빈 값"],
	])("%s 는 거부한다 (%s)", (charImageName) => {
		expect(createCharServerForm.safeParse(serverFormFixture({charImageName})).success).toBe(false);
	});

	it("이미지 Blob 자체는 서버 검증기에 없다", () => {
		expect("charImage" in createCharServerForm.shape).toBe(false);
	});
});

describe("업로드 서명 티켓", () => {
	/* size는 서명에 ContentLength로 박혀 업로드 시점의 상한이 된다. 즉 이 검사가
	   R2에 올라갈 수 있는 최대 크기를 그대로 정한다. */
	it("10MB까지 받는다", () => {
		expect(uploadTicket.safeParse({publicMode: "0", size: IMAGE_MAX_FILE_SIZE}).success).toBe(true);
		expect(uploadTicket.safeParse({publicMode: "0", size: IMAGE_MAX_FILE_SIZE + 1}).success).toBe(false);
	});

	it.each([
		[0, "빈 파일"],
		[-1, "음수"],
		[1.5, "정수 아님"],
	])("size %i 은 거부한다 (%s)", (size) => {
		expect(uploadTicket.safeParse({publicMode: "0", size}).success).toBe(false);
	});

	it("공개 범위는 0·1·2만 받는다", () => {
		expect(uploadTicket.safeParse({publicMode: "3", size: 100}).success).toBe(false);
		expect(uploadTicket.safeParse({publicMode: "", size: 100}).success).toBe(false);
	});
});

describe("템플릿 한도", () => {
	/* 서명 발급(uploadAction)과 등록(action) 두 곳이 이 값을 함께 본다.
	   한쪽만 고치면 버킷에 이미지만 쌓이고 등록에서 막히는 상태가 된다. */
	it("한도는 양수 하나로만 정의된다", () => {
		expect(MAX_TEMPLATE_LIMIT).toBeGreaterThan(0);
		expect(Number.isInteger(MAX_TEMPLATE_LIMIT)).toBe(true);
	});
});
