"use client";

import styles from "./CreateForm.module.css";
import ImageUploadField from "./ImageUploadField";
import CoreInfoSection from "./CoreInfoSection";
import ColorSection from "./ColorSection";
import ChoiceSection from "./ChoiceSection";
import {SubmitButton, NormalButton} from "@/components/ui/button";
import type {Control, FieldErrors, UseFormHandleSubmit, UseFormRegister, UseFormSetError, UseFormSetValue} from "react-hook-form";
import {CreateCharFormInputType} from "@/app/create/validator";
import {useId} from "react";
import {useRouter} from "next/navigation";

interface CreateFormProps {
	control: Control<CreateCharFormInputType>;
	register: UseFormRegister<CreateCharFormInputType>;
	handleSubmit: UseFormHandleSubmit<CreateCharFormInputType>;
	setError: UseFormSetError<CreateCharFormInputType>;
	setValue: UseFormSetValue<CreateCharFormInputType>;
	errors: FieldErrors<CreateCharFormInputType>;
	isSubmitting: boolean;
}

export default function CreateForm({control, register, handleSubmit, setError, setValue, errors, isSubmitting}: CreateFormProps) {
	const router = useRouter();

	const aiHeadingId = useId();
	const visibilityHeadingId = useId();

	const onSubmit = async (data: CreateCharFormInputType) => {
		//TODO: action.ts 구현 후 실제값을 반영 할 예정
		const result = {
			success: false,
			message: "테스트",
		};

		if (result.success) {
			//TODO: action.ts 구현 후 알맞는 url로 교체 할 예정
			router.replace("/");
		} else {
			setError("root", {
				message: result.message,
			});
		}
	};

	return (
		<form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
			<ImageUploadField control={control} errors={errors} setValue={setValue} />

			<CoreInfoSection control={control} errors={errors} />

			<ColorSection control={control} errors={errors} />

			<ChoiceSection
				headingId={aiHeadingId}
				heading="프로필 이미지에 AI를 사용했나요?"
				required
				warning="AI를 사용했지만 사용하지 않았다고 응답한 경우 프로필이 삭제될 수 있습니다."
				name="aiUsed"
				register={register}
				errors={errors}
				choices={[
					{value: "1", title: "네, AI를 사용했습니다"},
					{value: "0", title: "아니오, AI를 사용하지 않았습니다"},
				]}
			/>

			<ChoiceSection
				headingId={visibilityHeadingId}
				heading="공개 여부"
				name="publicMode"
				register={register}
				errors={errors}
				choices={[
					{value: "0", title: "공개", description: "검색과 링크를 통해 누구나 프로필을 볼 수 있습니다.", defaultChecked: true},
					{value: "1", title: "일부 공개", description: "링크를 가진 사람만 프로필을 볼 수 있습니다."},
					{value: "2", title: "비공개", description: "본인만 프로필을 볼 수 있습니다."},
				]}
			/>

			<div className={styles.actions}>
				<SubmitButton styleType="attention" disabled={isSubmitting} style={{flex: 1}}>
					{isSubmitting ? "제출중" : "프로필 완성"}
				</SubmitButton>

				<NormalButton disabled={isSubmitting} style={{flex: 1}}>
					임시 저장
				</NormalButton>
			</div>
		</form>
	);
}
