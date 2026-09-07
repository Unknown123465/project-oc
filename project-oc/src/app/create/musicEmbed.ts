/* 테마곡으로 받아 줄 서비스는 이 파일에만 적는다. 입력 검증(validator.ts),
   미리보기의 임베드 주소 변환(ProfileBlocks.tsx), iframe을 허용하는 CSP(proxy.ts)가
   모두 여기를 본다. 세 곳에 따로 적으면 서비스를 늘릴 때 조용히 어긋난다. */

/* 서비스마다 플레이어가 필요로 하는 높이가 다르다. */
const YOUTUBE_HEIGHT = 250;
const SPOTIFY_HEIGHT = 80;
const SOUNDCLOUD_HEIGHT = 155;

export type IframeHeight = typeof YOUTUBE_HEIGHT | typeof SPOTIFY_HEIGHT | typeof SOUNDCLOUD_HEIGHT;

export type MusicEmbed = {src: string; height: IframeHeight};

interface MusicService {
	/** 받아 줄 호스트. www.는 떼고 비교하므로 여기에 적지 않는다. */
	hosts: readonly string[];
	height: IframeHeight;
	/** 임베드 전용 주소로 바꾼다. 바꿀 수 없는 주소면 null. */
	toSrc: (url: URL) => string | null;
}

/* 서비스를 늘리려면 이 배열에 한 줄만 더하면 된다. */
const MUSIC_SERVICES: readonly MusicService[] = [
	{
		hosts: ["youtube.com", "m.youtube.com"],
		height: YOUTUBE_HEIGHT,
		toSrc: (url) => {
			const videoId: string | null = url.searchParams.get("v");

			return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
		},
	},
	{
		hosts: ["youtu.be"],
		height: YOUTUBE_HEIGHT,
		toSrc: (url) => {
			const videoId: string = url.pathname.slice(1);

			return videoId.trim() ? `https://www.youtube.com/embed/${videoId}` : null;
		},
	},
	{
		hosts: ["open.spotify.com"],
		height: SPOTIFY_HEIGHT,
		toSrc: (url) => (url.pathname.startsWith("/embed/") ? `https://open.spotify.com${url.pathname}` : `https://open.spotify.com/embed${url.pathname}`),
	},
	{
		hosts: ["soundcloud.com"],
		height: SOUNDCLOUD_HEIGHT,
		toSrc: (url) => `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}`,
	},
];

/** iframe이 실제로 불러오는 출처. 입력 호스트와 다르므로(soundcloud.com → w.soundcloud.com) 따로 적는다. */
export const MUSIC_EMBED_ORIGINS: readonly string[] = ["https://www.youtube.com", "https://open.spotify.com", "https://w.soundcloud.com"];

/** 평문 http로 받은 주소는 임베드하지 않는다. */
export const MUSIC_PROTOCOL_PATTERN: RegExp = /^https$/;

/* z.url({hostname})에 넘길 정규식. 위 서비스 목록에서 만들어 두 판정이 갈라지지 않게 한다.
   끝을 $로 잠그지 않으면 youtube.com.evil.com 같은 사칭 호스트가 통과한다.

   역슬래시는 두 번 적는다. 정규식이 아니라 템플릿 문자열에 쓰는 것이라
   "\."로 적으면 JS가 문자열 단계에서 역슬래시를 떼어 내 정규식에는 점 하나만
   남고, 그 점은 "아무 글자 하나"가 되어 youtubeXcom 같은 호스트가 통과한다. */
export const MUSIC_HOST_PATTERN: RegExp = new RegExp(
	`^(www\\.)?(${MUSIC_SERVICES.flatMap((service) => service.hosts)
		.map((host) => host.replaceAll(".", "\\."))
		.join("|")})$`,
	"i",
);

/* iframe은 우리 페이지 안에서 남의 사이트를 실행시키는 것이라, URL 형식만 보고
   그대로 넣으면 아무 사이트나 임베드된다. 그래서 호스트를 위 목록으로 막는다.
   덧붙여 유튜브는 watch 주소의 임베드를 X-Frame-Options로 거부하므로,
   서비스마다 정해진 임베드 전용 주소로 바꿔 줘야 실제로 재생된다. */
export function toMusicEmbed(raw: string): MusicEmbed | null {
	let url: URL;

	try {
		url = new URL(raw);
	} catch {
		return null;
	}

	if (!MUSIC_PROTOCOL_PATTERN.test(url.protocol.replace(/:$/, ""))) {
		return null;
	}

	const host: string = url.hostname.replace(/^www\./i, "").toLowerCase();

	const service: MusicService | undefined = MUSIC_SERVICES.find((candidate) => candidate.hosts.includes(host));

	if (service === undefined) {
		return null;
	}

	const src: string | null = service.toSrc(url);

	return src === null ? null : {src, height: service.height};
}
