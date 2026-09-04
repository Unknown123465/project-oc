"use client";

import sectionStyles from "./Section.module.css";
import styles from "./ImageUploadField.module.css";
import {useEffect, useId, useMemo} from "react";
import {Control, FieldErrors, useWatch} from "react-hook-form";
import {CreateCharFormInputType} from "@/app/create/validator";

interface ImageUploadFieldProps {
	control: Control<CreateCharFormInputType>;
	errors: FieldErrors<CreateCharFormInputType>;
}

export default function ImageUploadField({control, errors}: ImageUploadFieldProps) {
	const titleId = useId();

	const image = useWatch({
		name: "charImage",
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

	return (
		<section className={sectionStyles.section} aria-labelledby={titleId}>
			<h2 id={titleId}>
				캐릭터 이미지 <span className={sectionStyles.required}>*</span>
			</h2>

			<button type="button" className={styles.upload_zone}>
				{imageURL !== null ? (
					<img src={imageURL} alt="적용된 캐릭터 이미지" className={styles.upload_preview} />
				) : (
					<span className={styles.upload_prompt}>
						<b>캐릭터 이미지 추가</b>

						<span>유형과 영역을 선택해 적용합니다.</span>
					</span>
				)}
			</button>

			<div className={styles.upload_meta}>
				<span>가로형</span>

				<span>사각형 프레임</span>

				<button type="button" className={styles.text_link}>
					다시 편집
				</button>
			</div>

			<p className={sectionStyles.error_message}>{errors.charImage?.message}</p>
		</section>
	);
}
