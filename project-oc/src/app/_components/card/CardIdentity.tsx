import styles from "./ProfileCard.module.css";
import type {CardCharacter} from "./cardCharacter";

interface CardIdentityProps {
	character: Pick<CardCharacter, "charName" | "charMessage">;
}

export default function CardIdentity({character}: CardIdentityProps) {
	return (
		<header className={styles.identity}>
			<h1>{character.charName}</h1>

			<p>{character.charMessage}</p>
		</header>
	);
}
