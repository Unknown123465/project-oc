"use client";

import {useId} from "react";
import type {Control, FieldErrors} from "react-hook-form";
import sectionStyles from "./Section.module.css";
import styles from "./CoreInfoSection.module.css";
import {TextInput} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import type {CreateCharFormInputType} from "@/app/create/validator";

interface CoreInfoSectionProps {
	control: Control<CreateCharFormInputType>;
	errors: FieldErrors<CreateCharFormInputType>;
}

export default function CoreInfoSection({control, errors}: CoreInfoSectionProps) {
	const titleId = useId();

	const nameId = useId();
	const messageId = useId();
	const likeId = useId();
	const hateId = useId();
	const personalityId = useId();
	const tmiId = useId();

	return (
		<section className={sectionStyles.section} aria-labelledby={titleId}>
			<h2 id={titleId}>핵심 정보</h2>

			<div className={styles.fields}>
				<div className={styles.field}>
					<TextInput id={nameId} name="charName" control={control} label="이름" required maxLength={20} placeholder="캐릭터 이름을 입력하세요" describedBy={`${nameId}-help`} />

					<p id={`${nameId}-help`} className={styles.field_help}>
						최대 20자
					</p>
				</div>

				<div className={styles.field}>
					<TextInput
						id={messageId}
						name="charMessage"
						control={control}
						label="한 줄 소개"
						required
						maxLength={30}
						placeholder="이 캐릭터를 한 문장으로 소개해 주세요"
						describedBy={`${messageId}-help`}
					/>

					<p id={`${messageId}-help`} className={styles.field_help}>
						최대 30자
					</p>
				</div>

				<div className={styles.field}>
					<Textarea id={likeId} name="charLike" control={control} label="좋아하는 것" rows={3} maxLength={100} placeholder="무대 위에 서는 것" describedBy={`${likeId}-help`} />

					<p id={`${likeId}-help`} className={styles.field_help}>
						최대 100자 (공백 포함)
					</p>
				</div>

				<div className={styles.field}>
					<Textarea id={hateId} name="charHate" control={control} label="싫어하는 것" rows={3} maxLength={100} placeholder="포기하는 것" describedBy={`${hateId}-help`} />

					<p id={`${hateId}-help`} className={styles.field_help}>
						최대 100자 (공백 포함)
					</p>
				</div>

				<div className={styles.field}>
					<Textarea
						id={personalityId}
						name="charPersonality"
						control={control}
						label="성격"
						rows={4}
						maxLength={100}
						placeholder="밝고 긍정적이며 꾸준히 노력하는 성격입니다."
						describedBy={`${personalityId}-help`}
					/>

					<p id={`${personalityId}-help`} className={styles.field_help}>
						최대 100자 (공백 포함)
					</p>
				</div>

				<div className={styles.field}>
					<Textarea id={tmiId} name="charTmi" control={control} label="TMI" placeholder="한 줄에 하나씩, 최대 5개까지 입력하세요" describedBy={`${tmiId}-help`} />

					<p id={`${tmiId}-help`} className={styles.field_help}>
						줄바꿈으로 구분, 한 줄 최대 30자
					</p>
				</div>
			</div>
		</section>
	);
}
