import styles from "./ProfileBlocks.module.css";
import type {TemplateCharacter} from "./CharacterProfile";

interface ProfileBlocksProps {
	character: Pick<TemplateCharacter, "charName" | "charLike" | "charHate" | "charPersonality" | "charTmi" | "charMusic">;
}

export default function ProfileBlocks({character}: ProfileBlocksProps) {
	const {charName: name, charLike: like, charHate: hate, charPersonality: personality, charTmi: tmi, charMusic: music} = character;

	return (
		<div className={styles.blocks}>
			{like !== null ? (
				<section className={`${styles.block} ${styles.long_text} ${hate === null ? styles.block_wide : ""}`}>
					<h3>좋아해요</h3>

					<p>{like}</p>
				</section>
			) : null}

			{hate !== null ? (
				<section className={`${styles.block} ${styles.long_text} ${like === null ? styles.block_wide : ""}`}>
					<h3>싫어해요</h3>

					<p>{hate}</p>
				</section>
			) : null}

			{personality !== null ? (
				<section className={`${styles.block} ${styles.block_wide} ${styles.long_text}`}>
					<h3>성격</h3>

					<p>{personality}</p>
				</section>
			) : null}

			{tmi.length > 0 ? (
				<section className={`${styles.block} ${styles.block_wide}`}>
					<h3>TMI</h3>

					<ul>
						{tmi.map((line, index) => (
							<li key={`${index}-${line}`}>{line}</li>
						))}
					</ul>
				</section>
			) : null}

			{music !== null ? (
				<section className={`${styles.block} ${styles.block_wide} ${styles.theme_song}`}>
					<div className={styles.theme_song_head}>
						<h3>테마곡</h3>

						<p>캐릭터의 분위기를 음악과 함께 감상해 보세요.</p>
					</div>

					<div className={styles.theme_song_frame}>
						<iframe
							src={music.embedSrc}
							height={music.height}
							title={`${name} 캐릭터 테마곡`}
							sandbox="allow-scripts allow-same-origin allow-presentation"
							allow="accelerometer; clipboard-write; encrypted-media; fullscreen; gyroscope;"
							loading="lazy"></iframe>
					</div>
				</section>
			) : null}
		</div>
	);
}
