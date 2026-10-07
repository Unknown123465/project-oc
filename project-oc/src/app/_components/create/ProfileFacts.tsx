import {useWatch, type Control} from "react-hook-form";
import styles from "./ProfileFacts.module.css";
import {CreateCharFormInputType, parseValue} from "@/app/create/validator";

interface ProfileFactsProps {
	control: Control<CreateCharFormInputType>;
}

export default function ProfileFacts({control}: ProfileFactsProps) {
	const kind = useWatch({
		name: "charKind",
		control,
		compute(data) {
			return {
				label: "종족",
				value: parseValue("default", data, null),
			};
		},
	});
	const age = useWatch({
		name: "charAge",
		control,
		compute(data) {
			return {
				label: "나이",
				value: parseValue("default", data, null),
			};
		},
	});
	const birthDay = useWatch({
		name: "charBirthday",
		control,
		compute(data) {
			return {
				label: "생일",
				value: parseValue("default", data, null),
			};
		},
	});
	const height = useWatch({
		name: "charHeight",
		control,
		compute(data) {
			return {
				label: "키",
				value: parseValue("default", data, null),
			};
		},
	});
	const mbti = useWatch({
		name: "charMbti",
		control,
		compute(data) {
			return {
				label: "MBTI",
				value: parseValue("default", data, null),
			};
		},
	});
	const brithPlace = useWatch({
		name: "charBirthplace",
		control,
		compute(data) {
			return {
				label: "출신",
				value: parseValue("default", data, null),
			};
		},
	});

	let facts = [kind, age, birthDay, height, mbti, brithPlace];

	facts = facts.filter((fact) => fact.value !== null);

	return (
		<dl className={styles.facts}>
			{facts.map((fact) => (
				<div key={fact.label} className={styles.fact}>
					<dt>{fact.label}</dt>
					<dd>{fact.value}</dd>
				</div>
			))}
		</dl>
	);
}
