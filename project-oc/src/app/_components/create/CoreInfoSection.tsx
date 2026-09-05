"use client";

import {useId} from "react";
import type {Control, FieldErrors} from "react-hook-form";
import sectionStyles from "./Section.module.css";
import styles from "./CoreInfoSection.module.css";
import {TextInput} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {describedBy} from "@/components/ui/aria";
import type {CreateCharFormInputType} from "@/app/create/validator";

interface CoreInfoSectionProps {
	control: Control<CreateCharFormInputType>;
	errors: FieldErrors<CreateCharFormInputType>;
}

export default function CoreInfoSection({control, errors}: CoreInfoSectionProps) {
	const baseId = useId();

	const titleId = useId();

	const inputId = {
		charName: `${baseId}-char-name`,
		charMessage: `${baseId}-char-message`,
		charLike: `${baseId}-char-like`,
		charHate: `${baseId}-char-hate`,
		charPersonality: `${baseId}-char-personality`,
		charTmi: `${baseId}-char-tmi`,
	};
	const helpId = {
		charName: `${baseId}-char-name-help`,
		charMessage: `${baseId}-char-message-help`,
		charLike: `${baseId}-char-like-help`,
		charHate: `${baseId}-char-hate-help`,
		charPersonality: `${baseId}-char-personality-help`,
		charTmi: `${baseId}-char-tmi-help`,
	};
	const errorId = {
		charName: `${baseId}-char-name-error`,
		charMessage: `${baseId}-char-message-error`,
		charLike: `${baseId}-char-like-error`,
		charHate: `${baseId}-char-hate-error`,
		charPersonality: `${baseId}-char-personality-error`,
		charTmi: `${baseId}-char-tmi-error`,
	};

	return (
		<section className={sectionStyles.section} aria-labelledby={titleId}>
			<h2 id={titleId}>핵심 정보</h2>

			<div className={styles.fields}>
				<div className={styles.field}>
					<TextInput
						id={inputId.charName}
						name="charName"
						control={control}
						label="이름"
						required
						maxLength={20}
						placeholder="캐릭터 이름을 입력하세요"
						describedBy={describedBy(helpId.charName, errors.charName && errorId.charName)}
					/>

					<div>
						<p id={helpId.charName} className={styles.field_help}>
							최대 20자
						</p>

						<p id={errorId.charName} className={sectionStyles.error_message}>
							{errors.charName?.message}
						</p>
					</div>
				</div>

				<div className={styles.field}>
					<TextInput
						id={inputId.charMessage}
						name="charMessage"
						control={control}
						label="한 줄 소개"
						required
						maxLength={30}
						placeholder="이 캐릭터를 한 문장으로 소개해 주세요"
						describedBy={describedBy(helpId.charMessage, errors.charMessage && errorId.charMessage)}
					/>

					<div>
						<p id={helpId.charMessage} className={styles.field_help}>
							최대 30자
						</p>

						<p id={errorId.charMessage} className={sectionStyles.error_message}>
							{errors.charMessage?.message}
						</p>
					</div>
				</div>

				<div className={styles.field}>
					<Textarea
						id={inputId.charLike}
						name="charLike"
						control={control}
						label="좋아하는 것"
						rows={3}
						maxLength={100}
						placeholder="무대 위에 서는 것"
						describedBy={describedBy(helpId.charLike, errors.charLike && errorId.charLike)}
					/>

					<div>
						<p id={helpId.charLike} className={styles.field_help}>
							최대 100자 (공백 포함)
						</p>

						<p id={errorId.charLike} className={sectionStyles.error_message}>
							{errors.charLike?.message}
						</p>
					</div>
				</div>

				<div className={styles.field}>
					<Textarea
						id={inputId.charHate}
						name="charHate"
						control={control}
						label="싫어하는 것"
						rows={3}
						maxLength={100}
						placeholder="포기하는 것"
						describedBy={describedBy(helpId.charHate, errors.charHate && errorId.charHate)}
					/>

					<div>
						<p id={helpId.charHate} className={styles.field_help}>
							최대 100자 (공백 포함)
						</p>

						<p id={errorId.charHate} className={sectionStyles.error_message}>
							{errors.charHate?.message}
						</p>
					</div>
				</div>

				<div className={styles.field}>
					<Textarea
						id={inputId.charPersonality}
						name="charPersonality"
						control={control}
						label="성격"
						rows={4}
						maxLength={100}
						placeholder="밝고 긍정적이며 꾸준히 노력하는 성격입니다."
						describedBy={describedBy(helpId.charPersonality, errors.charPersonality && errorId.charPersonality)}
					/>

					<div>
						<p id={helpId.charPersonality} className={styles.field_help}>
							최대 100자 (공백 포함)
						</p>

						<p id={errorId.charPersonality} className={sectionStyles.error_message}>
							{errors.charPersonality?.message}
						</p>
					</div>
				</div>

				<div className={styles.field}>
					<Textarea
						id={inputId.charTmi}
						name="charTmi"
						control={control}
						label="TMI"
						placeholder="한 줄에 하나씩, 최대 5개까지 입력하세요"
						describedBy={describedBy(helpId.charTmi, errors.charTmi && errorId.charTmi)}
					/>

					<div>
						<p id={helpId.charTmi} className={styles.field_help}>
							줄바꿈으로 구분, 한 줄 최대 30자
						</p>

						<p id={errorId.charTmi} className={sectionStyles.error_message}>
							{errors.charTmi?.message}
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
