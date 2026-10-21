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

export interface ProfileFact {
	key: FactKey;
	label: string;
	value: string;
}

/** 채워진 항목만 화면 순서대로 돌려준다. 카카오 공유 메시지도 같은 순서와 이름을 쓴다. */
export function toProfileFacts(character: Pick<TemplateCharacter, FactKey>): ProfileFact[] {
	return FACT_ORDER.flatMap((key) => {
		const value: string | null = character[key];

		return value === null ? [] : [{key, label: FACT_LABELS[key], value}];
	});
}

interface ProfileFactsProps {
	character: Pick<TemplateCharacter, FactKey>;
}

export default function ProfileFacts({character}: ProfileFactsProps) {
	const facts: ProfileFact[] = toProfileFacts(character);

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
