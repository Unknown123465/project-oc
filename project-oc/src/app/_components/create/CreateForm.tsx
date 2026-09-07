"use client";

import sectionStyles from "./Section.module.css";
import styles from "./CreateForm.module.css";
import ImageUploadField from "./ImageUploadField";
import CoreInfoSection from "./CoreInfoSection";
import ColorSection from "./ColorSection";
import ChoiceSection from "./ChoiceSection";
import {SubmitButton, NormalButton} from "@/components/ui/button";
import type {Control, FieldErrors, UseFormHandleSubmit, UseFormRegister, UseFormSetError, UseFormSetValue} from "react-hook-form";
import {createCharForm, type CreateCharFormInputType} from "@/app/create/validator";
import {useId} from "react";
import {useRouter} from "next/navigation";
import createCharAction from "@/app/create/action";
import createUploadUrlAction from "@/app/create/uploadAction";
import {IMAGE_UPLOAD_TYPE} from "@/app/create/imageEditor";

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
		const check = createCharForm.safeParse(data);

		if (!check.success) {
			setError("root", {
				message: check.error.issues[0].message,
			});

			return;
		}

		const {charImage, ...charData} = check.data;

		/* refine이 Blob임을 보장하지만 nullable이 붙어 있어 타입은 좁혀지지 않는다. */
		if (charImage === null) {
			setError("root", {
				message: "캐릭터 이미지를 업로드 해주세요.",
			});

			return;
		}

		/* 이미지는 서버를 거치지 않고 브라우저에서 R2로 곧장 올린다. 서버 액션 본문
		   제한(1MB)과 Vercel 요청 본문 제한(4.5MB)에 걸리지 않게 하기 위함이고,
		   서버 액션에는 업로드 결과 파일 이름만 넘어간다. */
		const issued = await createUploadUrlAction({publicMode: charData.publicMode, size: charImage.size});

		if (!issued.success) {
			setError("root", {
				message: issued.message,
			});

			return;
		}

		try {
			const uploaded: Response = await fetch(issued.uploadUrl, {
				method: "PUT",
				body: charImage,
				/* 서명에 박힌 값과 어긋나면 R2가 거부하므로 그대로 맞춰 보낸다. */
				headers: {"Content-Type": IMAGE_UPLOAD_TYPE},
			});

			if (!uploaded.ok) {
				throw new Error();
			}
		} catch {
			setError("root", {
				message: "이미지를 올리지 못했어요. 잠시 후 다시 시도해 주세요.",
			});

			return;
		}

		/* 이 시점부터 R2에는 파일이 올라가 있다. 등록이 실패하면 서버 액션이 그
		   파일을 지우고 돌아오므로 여기서 따로 정리하지 않는다. */
		const result = await createCharAction({...charData, charImageName: issued.imageName});

		if (result.success) {
			router.replace(result.link);
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

			<div className={styles.root_error}>
				<p className={sectionStyles.error_message}>{errors.root?.message}</p>
			</div>

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
