import styles from "./ProfileCard.module.css";
import {toProfileFacts, type ProfileFact} from "@/app/_components/template/ProfileFacts";
import type {CardCharacter} from "./cardCharacter";

interface CardFactsProps {
	character: Pick<CardCharacter, "charKind" | "charAge" | "charBirthday" | "charHeight" | "charMbti" | "charBirthplace">;
}

export default function CardFacts({character}: CardFactsProps) {
	const facts: ProfileFact[] = toProfileFacts(character);

	if (facts.length === 0) {
		return null;
	}

	return (
		<dl className={styles.facts}>
			{facts.map((fact) => (
				<div key={fact.key}>
					<dt>{fact.label}</dt>

					<dd>{fact.value}</dd>
				</div>
			))}
		</dl>
	);
}
