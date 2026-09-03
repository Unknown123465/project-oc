import type {Control, FieldErrors} from "react-hook-form";
import styles from "./OptionalFieldsDetails.module.css";
import {TextInput} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import type {CreateCharFormInputType} from "@/app/create/validator";

interface OptionalFieldsDetailsProps {
	control: Control<CreateCharFormInputType>;
	errors: FieldErrors<CreateCharFormInputType>;
}

const KIND_OPTIONS = [
	{value: "인간", label: "인간"},
	{value: "엘프", label: "엘프"},
	{value: "천사", label: "천사"},
	{value: "악마", label: "악마"},
	{value: "수인", label: "수인"},
	{value: "노바", label: "노바"},
];

export default function OptionalFieldsDetails({control, errors}: OptionalFieldsDetailsProps) {
	return (
		<details className={styles.optional_fields}>
			<summary>선택 정보 추가</summary>

			<div className={styles.optional_fields_body}>
				<Select name="charKind" control={control} label="종족" options={KIND_OPTIONS} placeholder="선택하지 않음" />

				<TextInput name="charAge" control={control} label="나이" maxLength={20} placeholder="예: 19세" />

				<TextInput name="charBirthday" control={control} label="생일" maxLength={10} placeholder="예: 2월 7일" />

				<TextInput name="charHeight" control={control} label="키" maxLength={10} placeholder="예: 162cm" />

				<TextInput name="charBirthplace" control={control} label="출신" maxLength={20} placeholder="예: 서울" />

				<TextInput name="charMbti" control={control} label="MBTI" maxLength={4} placeholder="예: ENFP" />

				<TextInput name="charMusic" control={control} label="테마곡 링크" placeholder="유튜브 또는 스포티파이, 사운드클라우드 링크" />
			</div>
		</details>
	);
}
