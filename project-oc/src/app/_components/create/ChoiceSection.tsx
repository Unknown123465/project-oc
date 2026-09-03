"use client";

import type {FieldErrors, UseFormRegister} from "react-hook-form";
import sectionStyles from "./Section.module.css";
import styles from "./ChoiceSection.module.css";
import type {CreateCharFormInputType} from "@/app/create/validator";

interface Choice {
	value: string;
	title: string;
	description?: string;
	defaultChecked?: boolean;
}

interface ChoiceSectionProps {
	headingId: string;
	heading: string;
	required?: boolean;
	warning?: string;
	name: "aiUsed" | "publicMode";
	choices: Choice[];
	register: UseFormRegister<CreateCharFormInputType>;
	errors:FieldErrors<CreateCharFormInputType>,
}

export default function ChoiceSection({headingId, heading, required, warning, name, choices, register, errors}: ChoiceSectionProps) {
	return (
		<section className={sectionStyles.section} aria-labelledby={headingId}>
			<h2 id={headingId}>
				{heading} {required ? <span className={sectionStyles.required}>*</span> : null}
			</h2>

			{warning ? <p className={styles.warning}>{warning}</p> : null}

			<div className={styles.choice_list}>
				{choices.map((choice) => (
					<label className={styles.choice_card} key={choice.value}>
						<input type="radio" value={choice.value} defaultChecked={choice.defaultChecked} {...register(name)} />

						<span>
							<b>{choice.title}</b>

							{choice.description ? <small>{choice.description}</small> : null}
						</span>
					</label>
				))}
			</div>
		</section>
	);
}
