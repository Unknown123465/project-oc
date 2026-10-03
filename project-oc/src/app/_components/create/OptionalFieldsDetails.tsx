import {useId} from "react";
import type {Control, FieldErrors} from "react-hook-form";
import styles from "./OptionalFieldsDetails.module.css";
import sectionStyles from "./Section.module.css";
import {TextInput} from "@/components/ui/input";
import {CHAR_MAX_LENGTH, type CreateCharFormInputType} from "@/app/create/validator";

interface OptionalFieldsDetailsProps {
	control: Control<CreateCharFormInputType>;
	errors: FieldErrors<CreateCharFormInputType>;
}

export default function OptionalFieldsDetails({control, errors}: OptionalFieldsDetailsProps) {
	const baseId = useId();

	/* 이 절에는 안내 문구가 없어 입력이 가리킬 설명 요소는 오류 하나뿐이다.
	   여럿을 이을 일이 없으므로 describedBy()를 쓰지 않고 그대로 넘긴다. */
	const errorId = {
		charKind: `${baseId}-char-kind-error`,
		charAge: `${baseId}-char-age-error`,
		charBirthday: `${baseId}-char-birthday-error`,
		charHeight: `${baseId}-char-height-error`,
		charBirthplace: `${baseId}-char-birthplace-error`,
		charMbti: `${baseId}-char-mbti-error`,
		charMusic: `${baseId}-char-music-error`,
	};

	return (
		<details className={styles.optional_fields}>
			<summary>선택 정보 추가</summary>

			<div className={styles.optional_fields_body}>
				<div className={styles.field}>
					<TextInput
						name="charKind"
						control={control}
						label="종족"
						maxLength={CHAR_MAX_LENGTH.charKind}
						placeholder="예: 인간"
						describedBy={errors.charKind ? errorId.charKind : undefined}
					/>

					<p id={errorId.charKind} className={sectionStyles.error_message}>
						{errors.charKind?.message}
					</p>
				</div>

				<div className={styles.field}>
					<TextInput
						name="charAge"
						control={control}
						label="나이"
						maxLength={20}
						placeholder="예: 19세"
						describedBy={errors.charAge ? errorId.charAge : undefined}
					/>

					<p id={errorId.charAge} className={sectionStyles.error_message}>
						{errors.charAge?.message}
					</p>
				</div>

				<div className={styles.field}>
					<TextInput
						name="charBirthday"
						control={control}
						label="생일"
						maxLength={10}
						placeholder="예: 2월 7일"
						describedBy={errors.charBirthday ? errorId.charBirthday : undefined}
					/>

					<p id={errorId.charBirthday} className={sectionStyles.error_message}>
						{errors.charBirthday?.message}
					</p>
				</div>

				<div className={styles.field}>
					<TextInput
						name="charHeight"
						control={control}
						label="키"
						maxLength={10}
						placeholder="예: 162cm"
						describedBy={errors.charHeight ? errorId.charHeight : undefined}
					/>

					<p id={errorId.charHeight} className={sectionStyles.error_message}>
						{errors.charHeight?.message}
					</p>
				</div>

				<div className={styles.field}>
					<TextInput
						name="charBirthplace"
						control={control}
						label="출신"
						maxLength={20}
						placeholder="예: 서울"
						describedBy={errors.charBirthplace ? errorId.charBirthplace : undefined}
					/>

					<p id={errorId.charBirthplace} className={sectionStyles.error_message}>
						{errors.charBirthplace?.message}
					</p>
				</div>

				<div className={styles.field}>
					<TextInput
						name="charMbti"
						control={control}
						label="MBTI"
						maxLength={4}
						placeholder="예: ENFP"
						describedBy={errors.charMbti ? errorId.charMbti : undefined}
					/>

					<p id={errorId.charMbti} className={sectionStyles.error_message}>
						{errors.charMbti?.message}
					</p>
				</div>

				<div className={styles.field}>
					<TextInput
						name="charMusic"
						control={control}
						validStyle
						label="테마곡 링크"
						placeholder="유튜브 또는 스포티파이, 사운드클라우드 링크"
						describedBy={errors.charMusic ? errorId.charMusic : undefined}
					/>

					<p id={errorId.charMusic} className={sectionStyles.error_message}>
						{errors.charMusic?.message}
					</p>
				</div>
			</div>
		</details>
	);
}
