"use client";

import sectionStyles from "./Section.module.css";
import styles from "./ImageUploadField.module.css";
import ImageUploadModal from "./ImageUploadModal";
import {useEffect, useId, useMemo, useState} from "react";
import {Control, FieldErrors, UseFormSetValue, useWatch} from "react-hook-form";
import {CreateCharFormInputType} from "@/app/create/validator";
import {IMAGE_FRAME_LABEL, IMAGE_TYPE_DEFINITIONS, type ImageFrame, type ImageType} from "@/app/create/imageEditor";

interface ImageUploadFieldProps {
	control: Control<CreateCharFormInputType>;
	errors: FieldErrors<CreateCharFormInputType>;
	setValue: UseFormSetValue<CreateCharFormInputType>;
}

export default function ImageUploadField({control, errors, setValue}: ImageUploadFieldProps) {
	const titleId = useId();

	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

	const image = useWatch({
		name: "charImage",
		control,
	});
	const profileLayout = useWatch({
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
		setIsModalOpen(false);
	};

	return (
		<section className={sectionStyles.section} aria-labelledby={titleId}>
			<h2 id={titleId}>
				캐릭터 이미지 <span className={sectionStyles.required}>*</span>
			</h2>

			<button type="button" className={styles.upload_zone} onClick={() => setIsModalOpen(true)}>
				{imageURL !== null ? (
					<img src={imageURL} alt="적용된 캐릭터 이미지" className={styles.upload_preview} />
				) : (
					<span className={styles.upload_prompt}>
						<b>캐릭터 이미지 추가</b>

						<span>유형과 영역을 선택해 적용합니다.</span>
					</span>
				)}
			</button>

			{imageURL !== null && profileLayout !== "" ? (
				<div className={styles.upload_meta}>
					<span>{IMAGE_TYPE_DEFINITIONS[profileLayout].label}</span>

					{imageFrame !== "" ? <span>{IMAGE_FRAME_LABEL[imageFrame]}</span> : null}

					<button type="button" className={styles.text_link} onClick={() => setIsModalOpen(true)}>
						다시 편집
					</button>
				</div>
			) : null}

			<p className={sectionStyles.error_message}>{errors.charImage?.message}</p>

			<ImageUploadModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onApply={handleApply} />
		</section>
	);
}
