import styles from "./ProfileCard.module.css";
import type {CardCharacter} from "./cardCharacter";

interface CardTmiProps {
	character: Pick<CardCharacter, "charTmi">;
}

export default function CardTmi({character}: CardTmiProps) {
	const tmi: string[] = character.charTmi;

	if (tmi.length === 0) {
		return null;
	}

	return (
		<section className={styles.block}>
			<h2>
				<i className="bi bi-caret-right-fill"></i> TMI
			</h2>

			<ul>
				{tmi.map((line, index) => (
					<li key={`${index}-${line}`}>{line}</li>
				))}
			</ul>
		</section>
	);
}
