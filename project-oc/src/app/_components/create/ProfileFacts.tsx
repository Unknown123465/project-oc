import styles from "./ProfileFacts.module.css";

const FACTS = [
	{label: "종족", value: "미입력"},
	{label: "나이", value: "미입력"},
	{label: "생일", value: "미입력"},
	{label: "키", value: "미입력"},
	{label: "MBTI", value: "미입력"},
	{label: "출신", value: "미입력"},
];

export default function ProfileFacts() {
	return (
		<dl className={styles.facts}>
			{FACTS.map((fact) => (
				<div className={styles.fact} key={fact.label}>
					<dt>{fact.label}</dt>
					<dd>{fact.value}</dd>
				</div>
			))}
		</dl>
	);
}
