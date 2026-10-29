import styles from "./ProfileCard.module.css";
import type {CardCharacter} from "./cardCharacter";

interface CardBlocksProps {
	character: Pick<CardCharacter, "charLike" | "charHate" | "charPersonality">;
}

export default function CardBlocks({character}: CardBlocksProps) {
	const {charLike: like, charHate: hate, charPersonality: personality} = character;

	if (like === null && hate === null && personality === null) {
		return null;
	}

	return (
		<div className={styles.blocks}>
			{like !== null ? (
				<section className={styles.block}>
					<h2>
						<i className="bi bi-caret-right-fill"></i> 좋아해요
					</h2>

					<p>{like}</p>
				</section>
			) : null}

			{hate !== null ? (
				<section className={styles.block}>
					<h2>
						<i className="bi bi-caret-right-fill"></i> 싫어해요
					</h2>

					<p>{hate}</p>
				</section>
			) : null}

			{personality !== null ? (
				<section className={styles.block}>
					<h2>
						<i className="bi bi-caret-right-fill"></i> 성격
					</h2>

					<p>{personality}</p>
				</section>
			) : null}
		</div>
	);
}
