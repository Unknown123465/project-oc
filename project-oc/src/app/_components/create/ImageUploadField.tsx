"use client";

import sectionStyles from "./Section.module.css";
import styles from "./ImageUploadField.module.css";
import ImageUploadModal, {type ImageUploadModalHandle} from "./ImageUploadModal";
import CreatePromptModal from "./CreatePromptModal";
import {useEffect, useId, useMemo, useRef, useState} from "react";
import {Control, FieldErrors, UseFormSetValue, UseFormSetValues, useWatch} from "react-hook-form";
import {AI_DRAFT_DISABLED_MESSAGE, CreateCharFormInputType} from "@/app/create/validator";
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
	file: File;
	layout: Exclude<ProfileLayout, "">;
	fx: number;
	fy: number;
}

interface ImageUploadFieldProps {
	control: Control<CreateCharFormInputType>;
	errors: FieldErrors<CreateCharFormInputType>;
	setValue: UseFormSetValue<CreateCharFormInputType>;
	setValues: UseFormSetValues<CreateCharFormInputType>;
	/** 서버가 알려준 오늘 남은 AI 초안 횟수. 모달이 여기서 출발해 스스로 줄인다. */
	aiDraftRemaining: number;
	aiDraftEnabled: boolean;
}

export default function ImageUploadField({control, errors, setValue, setValues, aiDraftRemaining, aiDraftEnabled}: ImageUploadFieldProps) {
	const titleId = useId();

	const [openedModal, setOpenedModal] = useState<"image" | "prompt" | null>(null);

	const imageModalRef = useRef<ImageUploadModalHandle>(null);

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
		return image instanceof File ? URL.createObjectURL(image) : null;
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

	/* 초안 모달이 닫힐 때 불린다. 레이아웃 추천을 반영한 경우에만 data가 오고, 그때는
	   참고 이미지를 이미지 편집기에 바로 실어 이어서 자르게 한다. 편집기 dialog는
	   항상 마운트돼 있어 open 전에 loadFile을 불러도 된다. */
	const imagePromptResultApply = (data?: PromptApplyValue) => {
		if (data) {
			setOpenedModal("image");
			imageModalRef.current?.loadFile(data);
		} else {
			setOpenedModal(null);
		}
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

			<ActionButton styleType="attention" className={styles.ai_draft_button} disabled={openedModal !== null || !aiDraftEnabled} onClick={() => setOpenedModal("prompt")}>
				<i className="bi bi-stars" aria-hidden="true"></i>
				AI로 프로필 초안 만들기
			</ActionButton>

			{!aiDraftEnabled ? <p className={styles.ai_draft_notice}>{AI_DRAFT_DISABLED_MESSAGE}</p> : null}

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

			<ImageUploadModal ref={imageModalRef} open={openedModal === "image"} onClose={() => setOpenedModal(null)} onApply={handleApply} />

			<CreatePromptModal open={openedModal === "prompt"} onClose={imagePromptResultApply} remainingToday={aiDraftRemaining} currentLayout={layout} setValuesByForm={setValues} />
		</section>
	);
}
