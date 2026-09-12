"use client";

import sectionStyles from "./Section.module.css";
import styles from "./ImageUploadField.module.css";
import ImageUploadModal from "./ImageUploadModal";
import CreatePromptModal from "./CreatePromptModal";
import {useEffect, useId, useMemo, useState} from "react";
import {Control, FieldErrors, UseFormSetValue, UseFormSetValues, useWatch} from "react-hook-form";
import {CreateCharFormInputType} from "@/app/create/validator";
import {IMAGE_FRAME_LABEL, IMAGE_TYPE_DEFINITIONS, type ImageFrame, type ImageType} from "@/app/create/imageEditor";
import {ProfileLayout} from "./ProfileSheet";
import {ActionButton} from "@/components/ui/button";

const LAYOUT_CLASS: Record<ProfileLayout, string> = {
	"": "",
	h: styles.horizontal,
	v: styles.vertical,
	s: styles.square,
};

export interface PromptApplyValue {
	file: Blob;
	layout: Exclude<ProfileLayout, "">;
	fx: number;
	fy: number;
}

interface ImageUploadFieldProps {
	control: Control<CreateCharFormInputType>;
	errors: FieldErrors<CreateCharFormInputType>;
	setValue: UseFormSetValue<CreateCharFormInputType>;
	setValues: UseFormSetValues<CreateCharFormInputType>;
}

export default function ImageUploadField({control, errors, setValue, setValues}: ImageUploadFieldProps) {
	const titleId = useId();

	const [openedModal, setOpenedModal] = useState<"image" | "prompt" | null>(null);

	const [promptApplyValue, setPromptApplyValue] = useState<Partial<PromptApplyValue>>({});

	const image = useWatch({
		name: "charImage",
		control,
	});
	const layout = useWatch({
		name: "charProfileLayout",
		control,
	});
	const imageFrame = useWatch({
		name: "charImageFrame",
		control,
	});

	const imageURL = useMemo(() => {
		return image instanceof Blob ? URL.createObjectURL(image) : null;
	}, [image]);

	useEffect(() => {
		if (imageURL !== null) {
			return () => {
				URL.revokeObjectURL(imageURL);
			};
		}
	}, [imageURL]);

	const handleApply = (result: {image: Blob; imageType: ImageType; imageFrame: ImageFrame}) => {
		setValue("charImage", result.image, {shouldValidate: true, shouldDirty: true});
		setValue("charProfileLayout", result.imageType, {shouldValidate: true, shouldDirty: true});
		setValue("charImageFrame", result.imageFrame, {shouldValidate: true, shouldDirty: true});
		setOpenedModal(null);
	};

	const imagePromptResultApply = (data: Pick<PromptApplyValue, keyof PromptApplyValue>) => {
		setPromptApplyValue(data);
		setOpenedModal("image");
	};

	return (
		<section className={sectionStyles.section} aria-labelledby={titleId}>
			<h2 id={titleId}>
				캐릭터 이미지 <span className={sectionStyles.required}>*</span>
			</h2>

			<button type="button" className={styles.upload_zone} disabled={openedModal !== null} onClick={() => setOpenedModal("image")}>
				{imageURL !== null ? (
					<img src={imageURL} alt="적용된 캐릭터 이미지" className={`${styles.upload_preview} ${LAYOUT_CLASS[layout]}`} />
				) : (
					<span className={styles.upload_prompt}>
						<b>캐릭터 이미지 추가</b>

						<span>유형과 영역을 선택해 적용합니다.</span>
					</span>
				)}
			</button>

			<ActionButton styleType="attention" className={styles.ai_draft_button} disabled={openedModal !== null} onClick={() => setOpenedModal("prompt")}>
				<i className="bi bi-stars" aria-hidden="true"></i>
				AI로 프로필 초안 만들기
			</ActionButton>

			{imageURL !== null && layout !== "" ? (
				<div className={styles.upload_meta}>
					<span>{IMAGE_TYPE_DEFINITIONS[layout].label}</span>

					{imageFrame !== "" ? <span>{IMAGE_FRAME_LABEL[imageFrame]}</span> : null}

					<button type="button" className={styles.text_link} disabled={openedModal !== null} onClick={() => setOpenedModal("image")}>
						다시 편집
					</button>
				</div>
			) : null}

			<p className={sectionStyles.error_message}>{errors.charImage?.message}</p>

			<ImageUploadModal open={openedModal === "image"} onClose={() => setOpenedModal(null)} onApply={handleApply} />

			<CreatePromptModal
				open={openedModal === "prompt"}
				onClose={() => setOpenedModal(null)}
				remainingToday={10}
				dailyLimit={10}
				currentLayout={layout}
				setValuesByForm={setValues}
				imagePromptResultApply={imagePromptResultApply}
			/>
		</section>
	);
}
