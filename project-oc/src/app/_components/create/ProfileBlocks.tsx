import {useWatch, type Control} from "react-hook-form";
import styles from "./ProfileBlocks.module.css";
import {CreateCharFormInputType} from "@/app/create/validator";
import {toMusicEmbed, type IframeHeight} from "@/app/create/musicEmbed";
import z from "zod";

interface ProfileBlocksProps {
	control: Control<CreateCharFormInputType>;
}

/* 미리보기에 보여 줄 TMI 개수. validator.ts의 상한과 같은 값이어야 한다. */
const TMI_MAX = 5;

const MUSIC_URL = z.httpUrl("링크가 유효하지 않아요.");

type MusicView = {kind: "empty"} | {kind: "invalid"; message: string} | {kind: "unsupported"} | {kind: "embed"; src: string; height: IframeHeight};

function resolveMusic(raw: string): MusicView {
	if (!raw) {
		return {kind: "empty"};
	}

	const parsed = MUSIC_URL.safeParse(raw);

	if (!parsed.success) {
		return {kind: "invalid", message: parsed.error.issues[0].message};
	}

	const result = toMusicEmbed(parsed.data);

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

			{musicView.kind !== "empty" ? (
				<section className={styles.block_wide}>
					<h3>테마곡</h3>

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
			) : null}
		</div>
	);
}
