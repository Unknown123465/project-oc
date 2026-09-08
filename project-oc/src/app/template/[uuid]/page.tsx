import CharacterProfile, {type TemplateCharacter} from "@/app/_components/template/CharacterProfile";

/* uuid로 실제 캐릭터를 조회하는 로직은 아직 없다. 구조와 레이아웃을 확인하기 위해
   목업(profile-horizontal/vertical/square.html)과 같은 내용의 목데이터를 그대로 쓴다. */
const MOCK_CHARACTER: TemplateCharacter = {
	charName: "티아라",
	charMessage: "오늘도 내일도, 반짝이는 마음으로 화이팅!",
	charProfileLayout: "h",
	charImage: "/test char.png",
	charColor: "#ffafbd",
	charKind: "노바",
	charAge: "19세",
	charBirthday: "4월 7일",
	charHeight: "157cm",
	charMbti: "ENFP",
	charBirthplace: "별빛 정거장",
	charLike: "딸기 우유, 반짝이는 액세서리, 함께 걷는 밤길",
	charHate: "혼자 남겨지는 것, 약속을 가볍게 여기는 태도",
	charPersonality: "누구에게나 먼저 손을 내미는 씩씩한 낙천가. 분위기를 밝게 만드는 데 능하지만, 소중한 사람의 일 앞에서는 생각보다 완고하다.",
	charTmi: ["긴장하면 머리핀을 만진다.", "가방에 사탕을 늘 넣어 둔다.", "사진 찍을 때 같은 포즈를 고집한다."],
	charMusic: {
		href: "https://youtu.be/yEWFxNNjalI?si=WJYZTzK1up8Ub4MQ",
		embedSrc: "https://www.youtube.com/embed/yEWFxNNjalI",
		height: 250,
	},
	aiUsed: true,
	likeCount: 132,
};

export default async function TemplatePage({params}: PageProps<"/template/[uuid]">) {
	const {uuid} = await params;

	return <CharacterProfile uuid={uuid} character={MOCK_CHARACTER} />;
}
