"use client";

import type {FieldErrors, UseFormRegister} from "react-hook-form";
import sectionStyles from "./Section.module.css";
import styles from "./ChoiceSection.module.css";
import type {CreateCharFormInputType} from "@/app/create/validator";
import {describedBy} from "@/components/ui/aria";

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
	errors: FieldErrors<CreateCharFormInputType>;
}

export default function ChoiceSection({headingId, heading, required, warning, name, choices, register, errors}: ChoiceSectionProps) {
	const warningId: string = `${headingId}-warning`;
	const errorId: string = `${headingId}-error`;

	return (
		<section className={sectionStyles.section} aria-labelledby={headingId}>
			<h2 id={headingId}>
				{heading} {required ? <span className={sectionStyles.required}>*</span> : null}
			</h2>

			{warning ? (
				<p id={warningId} className={styles.warning}>
					{warning}
				</p>
			) : null}

			{/* 경고와 오류는 선택지 하나가 아니라 묶음 전체에 걸린 설명이라 여기에 건다.
			    라디오마다 걸면 같은 문구를 선택지 수만큼 되풀이해 읽는다. 또 role 없는
			    div는 접근성 트리에서 generic이라 aria-describedby가 노출되지 않으므로,
			    묶음이라는 사실을 radiogroup으로 먼저 밝혀 둬야 한다. */}
			<div
				className={styles.choice_list}
				role="radiogroup"
				aria-labelledby={headingId}
				aria-required={required}
				aria-describedby={describedBy(warning && warningId, errors[name] && errorId)}>
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

			<p id={errorId} className={sectionStyles.error_message}>
				{errors[name]?.message}
			</p>
		</section>
	);
}
