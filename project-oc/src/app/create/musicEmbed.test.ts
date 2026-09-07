import {describe, expect, it} from "vitest";
import {MUSIC_EMBED_ORIGINS, MUSIC_HOST_PATTERN, toMusicEmbed} from "./musicEmbed";

/* 이 모듈이 세 곳(검증기·미리보기·CSP)의 단일 출처다. 여기가 흔들리면
   "검증은 통과했는데 화면에서는 안 뜨는" 어긋남이 조용히 생긴다. */

describe("호스트 패턴", () => {
	it("지원 호스트를 받는다", () => {
		expect(MUSIC_HOST_PATTERN.test("youtube.com")).toBe(true);
		expect(MUSIC_HOST_PATTERN.test("www.youtube.com")).toBe(true);
		expect(MUSIC_HOST_PATTERN.test("m.youtube.com")).toBe(true);
		expect(MUSIC_HOST_PATTERN.test("youtu.be")).toBe(true);
		expect(MUSIC_HOST_PATTERN.test("open.spotify.com")).toBe(true);
		expect(MUSIC_HOST_PATTERN.test("soundcloud.com")).toBe(true);
	});

	/* 회귀 방지: 템플릿 문자열에 "\."로 적으면 JS가 문자열 단계에서 역슬래시를
	   떼어 내 정규식에는 점 하나만 남는다. 그 점은 "아무 글자"라서 아래가 통과했다. */
	it("점은 아무 글자가 아니라 점이어야 한다", () => {
		expect(MUSIC_HOST_PATTERN.test("youtubeXcom")).toBe(false);
		expect(MUSIC_HOST_PATTERN.test("youtu-be")).toBe(false);
		expect(MUSIC_HOST_PATTERN.test("openXspotify.com")).toBe(false);
		expect(MUSIC_HOST_PATTERN.test("wwwXyoutube.com")).toBe(false);
	});

	it("앞뒤로 덧붙인 사칭 호스트를 막는다", () => {
		expect(MUSIC_HOST_PATTERN.test("youtube.com.evil.com")).toBe(false);
		expect(MUSIC_HOST_PATTERN.test("evil.youtube.com")).toBe(false);
		expect(MUSIC_HOST_PATTERN.test("notyoutube.com")).toBe(false);
	});
});

describe("임베드 주소 변환", () => {
	/* 유튜브는 watch 주소의 임베드를 X-Frame-Options로 거부한다. 형식 검증만
	   통과시키고 주소를 바꾸지 않으면 빈 iframe이 남는다. */
	it("유튜브 watch 주소를 embed 주소로 바꾼다", () => {
		expect(toMusicEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
			src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
			height: 250,
		});
	});

	it("youtu.be 단축 주소도 같은 embed 주소로 모은다", () => {
		expect(toMusicEmbed("https://youtu.be/dQw4w9WgXcQ")?.src).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
	});

	it("이미 embed 경로인 스포티파이 주소를 두 번 감싸지 않는다", () => {
		expect(toMusicEmbed("https://open.spotify.com/embed/track/abc")?.src).toBe("https://open.spotify.com/embed/track/abc");
		expect(toMusicEmbed("https://open.spotify.com/track/abc")?.src).toBe("https://open.spotify.com/embed/track/abc");
	});

	it("사운드클라우드는 원본 주소를 인코딩해 플레이어에 넘긴다", () => {
		expect(toMusicEmbed("https://soundcloud.com/artist/track")?.src).toBe("https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fartist%2Ftrack");
	});

	it("서비스마다 필요한 높이가 다르다", () => {
		expect(toMusicEmbed("https://open.spotify.com/track/abc")?.height).toBe(80);
		expect(toMusicEmbed("https://soundcloud.com/artist/track")?.height).toBe(155);
	});

	it.each([
		["https://www.youtube.com/", "영상 id 없음"],
		["https://youtu.be/", "단축 주소에 id 없음"],
		["http://www.youtube.com/watch?v=1", "평문 http"],
		["https://youtube.com.evil.com/watch?v=1", "사칭 호스트"],
		["https://vimeo.com/1", "미지원 서비스"],
		["그냥 문자열", "URL이 아님"],
		["javascript:alert(1)", "스크립트 스킴"],
	])("%s 는 임베드하지 않는다 (%s)", (raw) => {
		expect(toMusicEmbed(raw)).toBeNull();
	});
});

describe("CSP frame-src 출처", () => {
	/* 입력 호스트(soundcloud.com)와 실제 iframe 출처(w.soundcloud.com)가 달라
	   목록을 따로 둔다. 여기 빠진 출처는 CSP에 막혀 화면에서만 조용히 실패한다. */
	it("변환 결과의 출처가 모두 허용 목록에 있다", () => {
		const samples: string[] = ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://open.spotify.com/track/abc", "https://soundcloud.com/artist/track"];

		for (const sample of samples) {
			const embed = toMusicEmbed(sample);

			expect(embed).not.toBeNull();
			expect(MUSIC_EMBED_ORIGINS).toContain(new URL(embed!.src).origin);
		}
	});
});
