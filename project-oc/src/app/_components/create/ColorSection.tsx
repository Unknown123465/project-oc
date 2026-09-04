"use client";

import {useId} from "react";
import type {Control, FieldErrors, UseFormRegister} from "react-hook-form";
import sectionStyles from "./Section.module.css";
import styles from "./ColorSection.module.css";
import OptionalFieldsDetails from "./OptionalFieldsDetails";
import type {CreateCharFormInputType} from "@/app/create/validator";

interface ColorSectionProps {
	control: Control<CreateCharFormInputType>;
	register: UseFormRegister<CreateCharFormInputType>;
	errors: FieldErrors<CreateCharFormInputType>;
}

export default function ColorSection({control, register, errors}: ColorSectionProps) {
	const titleId = useId();
	const colorId = useId();

	return (
		<section className={sectionStyles.section} aria-labelledby={titleId}>
			<h2 id={titleId}>프로필 색상</h2>

			<div className={styles.field}>
				<label htmlFor={colorId}>퍼스널 컬러</label>

				<input className={styles.color_input} id={colorId} type="color" {...register("charColor")} />

				<p className={styles.field_help}>캐릭터의 강조선과 배경에 적용됩니다.</p>

				<p className={sectionStyles.error_message}>{errors.charColor?.message}</p>
			</div>

			<OptionalFieldsDetails control={control} errors={errors} />
		</section>
	);
}
