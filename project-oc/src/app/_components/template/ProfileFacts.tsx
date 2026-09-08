import styles from "./ProfileFacts.module.css";
import type {TemplateCharacter} from "./CharacterProfile";

type FactKey = "charKind" | "charAge" | "charBirthday" | "charHeight" | "charMbti" | "charBirthplace";

const FACT_LABELS: Record<FactKey, string> = {
	charKind: "종족",
	charAge: "나이",
	charBirthday: "생일",
	charHeight: "키",
	charMbti: "MBTI",
	charBirthplace: "출신",
};

const FACT_ORDER: FactKey[] = ["charKind", "charAge", "charBirthday", "charHeight", "charMbti", "charBirthplace"];

interface ProfileFactsProps {
	character: Pick<TemplateCharacter, FactKey>;
}

export default function ProfileFacts({character}: ProfileFactsProps) {
	const facts = FACT_ORDER.map((key) => ({key, label: FACT_LABELS[key], value: character[key]})).filter((fact) => fact.value !== null);

	return (
		<dl className={styles.facts}>
			{facts.map((fact) => (
				<div key={fact.key} className={styles.fact}>
					<dt>{fact.label}</dt>

					<dd>{fact.value}</dd>
				</div>
			))}
		</dl>
	);
}
