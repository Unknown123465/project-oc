"use client";

import {useId} from "react";
import {Control, Controller, FieldErrors} from "react-hook-form";
import sectionStyles from "./Section.module.css";
import styles from "./ColorSection.module.css";
import OptionalFieldsDetails from "./OptionalFieldsDetails";
import type {CreateCharFormInputType} from "@/app/create/validator";
import {TextInputWithField} from "@/components/ui/input";
import ColorPreset from "./ColorPreset";

interface ColorSectionProps {
	control: Control<CreateCharFormInputType>;
	errors: FieldErrors<CreateCharFormInputType>;
}

/* input[type=color]는 #rrggbb만 받는다. 텍스트 칸에 아직 다 못 적은 값을 넘기면
   브라우저가 제 나름대로 보정해 버리므로, 완성된 값일 때만 넘긴다. */
const HEX = /^#[0-9a-f]{6}$/i;

export default function ColorSection({control, errors}: ColorSectionProps) {
	const titleId = useId();
	const colorId = useId();

	const colorHelpId: string = `${colorId}-help`;
	const colorErrorId: string = `${colorId}-error`;

	return (
		<section className={sectionStyles.section} aria-labelledby={titleId}>
			<h2 id={titleId}>프로필 색상</h2>

			<div className={styles.field}>
				<label htmlFor={colorId}>퍼스널 컬러</label>

				{/* 색상 피커·HEX 입력·프리셋이 charColor 하나를 공유한다. 같은 name으로
				    register를 여러 번 부르면 비제어 입력끼리 값이 어긋나므로,
				    Controller 하나가 들고 있는 field를 셋이 나눠 쓴다. */}
				<Controller
					name="charColor"
					control={control}
					render={({field, fieldState}) => (
						<div className={styles.color_input}>
							<input
								id={colorId}
								type="color"
								name={field.name}
								value={HEX.test(field.value) ? field.value : "#000000"}
								onChange={field.onChange}
								onBlur={field.onBlur}
								aria-describedby={`${colorHelpId} ${colorErrorId}`}
							/>

							<TextInputWithField
								{...field}
								fieldState={fieldState}
								label="퍼스널 컬러"
								ariaLabelOnly
								width="5.6em"
								height={40}
								padding={10}
								maxLength={7}
								spellCheck={false}
								describedBy={`${colorHelpId} ${colorErrorId}`}
							/>

							<ColorPreset value={field.value} onChange={field.onChange} />
						</div>
					)}
				/>

				<p id={colorHelpId} className={styles.field_help}>
					캐릭터의 강조선과 배경에 적용됩니다.
				</p>

				<p id={colorErrorId} className={sectionStyles.error_message}>
					{errors.charColor?.message}
				</p>
			</div>

			<OptionalFieldsDetails control={control} errors={errors} />
		</section>
	);
}
