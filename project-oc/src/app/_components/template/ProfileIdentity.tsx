import styles from "./ProfileIdentity.module.css";
import type {TemplateCharacter} from "./CharacterProfile";

interface ProfileIdentityProps {
	character: Pick<TemplateCharacter, "charName" | "charMessage">;
	centered?: boolean;
}

export default function ProfileIdentity({character, centered = false}: ProfileIdentityProps) {
	return (
		<header className={`${styles.identity} ${centered ? styles.centered : ""}`}>
			<p className={styles.eyebrow}>Character profile</p>

			<h1>{character.charName}</h1>

			<p>{character.charMessage}</p>
		</header>
	);
}
