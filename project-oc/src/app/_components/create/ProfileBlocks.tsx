import {useWatch, type Control} from "react-hook-form";
import styles from "./ProfileBlocks.module.css";
import {CreateCharFormInputType, parseValue, CHAR_TMI_MAX_LINES} from "@/app/create/validator";
import {toMusicEmbed, SOUNDCLOUD_SHORT_LINK_MESSAGE, SOUNDCLOUD_SHORT_LINK_PATTERN, type IframeHeight} from "@/app/create/musicEmbed";
import z from "zod";

interface ProfileBlocksProps {
	control: Control<CreateCharFormInputType>;
}

const MUSIC_URL = z.httpUrl("링크가 유효하지 않아요.");

type MusicView = {kind: "empty"} | {kind: "invalid"; message: string} | {kind: "unsupported"} | {kind: "tooShortSoundCloudLink"; message: string} | {kind: "embed"; src: string; height: IframeHeight};

function resolveMusic(raw: string): MusicView {
	if (!raw) {
		return {kind: "empty"};
	}

	const parsed = MUSIC_URL.safeParse(raw);

	if (!parsed.success) {
		return {kind: "invalid", message: parsed.error.issues[0].message};
		// https://on.soundcloud.com/2qsoGx5dZGWEdPJwvb
	} else if (SOUNDCLOUD_SHORT_LINK_PATTERN.test(raw)) {
		return {kind: "tooShortSoundCloudLink", message: SOUNDCLOUD_SHORT_LINK_MESSAGE};
	}

	const result = toMusicEmbed(parsed.data);

	return result === null ? {kind: "unsupported"} : {kind: "embed", ...result};
}

export default function ProfileBlocks({control}: ProfileBlocksProps) {
	const like = useWatch({
		name: "charLike",
		control,
		compute(data) {
			return parseValue("default", data, null);
		},
	});
	const hate = useWatch({
		name: "charHate",
		control,
		compute(data) {
			return parseValue("default", data, null);
		},
	});
	const personality = useWatch({
		name: "charPersonality",
		control,
		compute(data) {
			return parseValue("default", data, null);
		},
	});
	const tmi = useWatch({
		name: "charTmi",
		control,
		compute(data) {
			const value: string | null = parseValue("tmi", data, null);

			return value ? value.split("\n").slice(0, CHAR_TMI_MAX_LINES) : [];
		},
	});
	const music = useWatch({
		name: "charMusic",
		control,
		compute(data) {
			return parseValue("default", data, null) ?? "";
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

			{musicView.kind !== "empty" ? (
				<section className={`${styles.block_wide} ${styles.theme_song}`}>
					<div className={styles.theme_song_head}>
						<h3>테마곡</h3>
					</div>

					{musicView.kind === "invalid" || musicView.kind === "tooShortSoundCloudLink" ? <p>{musicView.message}</p> : null}

					{musicView.kind === "unsupported" ? <p>유튜브, 스포티파이, 사운드클라우드 링크만 재생할 수 있어요.</p> : null}

					{musicView.kind === "embed" ? (
						<div className={styles.theme_song_frame}>
							<iframe
								src={musicView.src}
								height={musicView.height}
								title="테마곡 미리듣기"
								sandbox="allow-scripts allow-same-origin allow-presentation"
								allow="accelerometer; clipboard-write; encrypted-media; fullscreen; gyroscope;"
								loading="lazy"
							></iframe>
						</div>
					) : null}
				</section>
			) : null}
		</div>
	);
}
