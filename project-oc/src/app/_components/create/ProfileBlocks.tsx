import {useWatch, type Control} from "react-hook-form";
import styles from "./ProfileBlocks.module.css";
import {CreateCharFormInputType} from "@/app/create/validator";
import z from "zod";

const YOUTUBE_HEIGHT = 250;
const SPOTIFY_HEIGHT = 80;
const SOUNDCLOUD_HEIGHT = 155;

type IframeHeight = typeof YOUTUBE_HEIGHT | typeof SPOTIFY_HEIGHT | typeof SOUNDCLOUD_HEIGHT;

interface ProfileBlocksProps {
	control: Control<CreateCharFormInputType>;
}

/* 미리보기에 보여 줄 TMI 개수. validator.ts의 상한과 같은 값이어야 한다. */
const TMI_MAX = 5;

const MUSIC_URL = z.httpUrl("링크가 유효하지 않아요.");

type MusicView = {kind: "empty"} | {kind: "invalid"; message: string} | {kind: "unsupported"} | {kind: "embed"; src: string; height: IframeHeight};

/* iframe은 우리 페이지 안에서 남의 사이트를 실행시키는 것이라, URL 형식만 보고
   그대로 넣으면 아무 사이트나 임베드된다. 그래서 도메인을 화이트리스트로 막는다.
   덧붙여 유튜브는 watch 주소의 임베드를 X-Frame-Options로 거부하므로,
   서비스마다 정해진 임베드 전용 주소로 바꿔 줘야 실제로 재생된다. */
function toEmbedUrl(raw: string): {src: string; height: IframeHeight} | null {
	let url: URL;

	try {
		url = new URL(raw);
	} catch {
		return null;
	}

	const host = url.hostname.replace(/^www\./, "");

	if (host === "youtube.com" || host === "m.youtube.com") {
		const videoId: string | null = url.searchParams.get("v");

		return videoId
			? {
					src: `https://www.youtube.com/embed/${videoId}`,
					height: YOUTUBE_HEIGHT,
				}
			: null;
	} else if (host === "youtu.be") {
		const videoId: string = url.pathname.slice(1);

		return videoId.trim()
			? {
					src: `https://www.youtube.com/embed/${videoId}`,
					height: YOUTUBE_HEIGHT,
				}
			: null;
	} else if (host === "open.spotify.com") {
		return {
			src: url.pathname.startsWith("/embed/") ? `https://open.spotify.com${url.pathname}` : `https://open.spotify.com/embed${url.pathname}`,
			height: SPOTIFY_HEIGHT,
		};
	} else if (host === "soundcloud.com") {
		return {
			src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}`,
			height: SOUNDCLOUD_HEIGHT,
		};
	} else {
		return null;
	}
}

function resolveMusic(raw: string): MusicView {
	if (!raw) {
		return {kind: "empty"};
	}

	const parsed = MUSIC_URL.safeParse(raw);

	if (!parsed.success) {
		return {kind: "invalid", message: parsed.error.issues[0].message};
	}

	const result = toEmbedUrl(parsed.data);

	return result === null ? {kind: "unsupported"} : {kind: "embed", ...result};
}

export default function ProfileBlocks({control}: ProfileBlocksProps) {
	const like = useWatch({
		name: "charLike",
		control,
		compute(data) {
			return data.trim() || null;
		},
	});
	const hate = useWatch({
		name: "charHate",
		control,
		compute(data) {
			return data.trim() || null;
		},
	});
	const personality = useWatch({
		name: "charPersonality",
		control,
		compute(data) {
			return data.trim() || null;
		},
	});
	const tmi = useWatch({
		name: "charTmi",
		control,
		compute(data) {
			return data
				.split("\n")
				.filter((line) => line.trim())
				.slice(0, TMI_MAX);
		},
	});
	const music = useWatch({
		name: "charMusic",
		control,
		compute(data) {
			return data.trim();
		},
	});

	const musicView = resolveMusic(music);

	return (
		<div className={styles.blocks}>
			{like !== null ? (
				<section className={hate !== null ? styles.block : styles.block_wide}>
					<h3>좋아해요</h3>

					<p>{like}</p>
				</section>
			) : null}

			{hate !== null ? (
				<section className={like !== null ? styles.block : styles.block_wide}>
					<h3>싫어해요</h3>

					<p>{hate}</p>
				</section>
			) : null}

			{personality !== null ? (
				<section className={styles.block_wide}>
					<h3>성격</h3>

					<p>{personality}</p>
				</section>
			) : null}

			{tmi.length > 0 ? (
				<section className={styles.block_wide}>
					<h3>TMI</h3>

					<ul>
						{tmi.map((data, index) => (
							<li key={`${index}-${data}`}>{data}</li>
						))}
					</ul>
				</section>
			) : null}

			<section className={styles.block_wide}>
				<h3>테마곡</h3>

				{musicView.kind === "empty" ? <p>테마곡 링크를 입력하면 여기에 표시돼요.</p> : null}

				{musicView.kind === "invalid" ? <p>{musicView.message}</p> : null}

				{musicView.kind === "unsupported" ? <p>유튜브, 스포티파이, 사운드클라우드 링크만 재생할 수 있어요.</p> : null}

				{musicView.kind === "embed" ? (
					<iframe
						src={musicView.src}
						height={musicView.height}
						title="테마곡 미리듣기"
						sandbox="allow-scripts allow-same-origin allow-presentation"
						allow="accelerometer; clipboard-write; encrypted-media; fullscreen; gyroscope;"
						loading="lazy"></iframe>
				) : null}
			</section>
		</div>
	);
}
