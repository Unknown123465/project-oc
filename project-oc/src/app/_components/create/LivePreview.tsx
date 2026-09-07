import {useWatch, type Control} from "react-hook-form";
import styles from "./LivePreview.module.css";
import ProfileSheet, {type ProfileLayout} from "./ProfileSheet";
import {CreateCharFormInputType} from "@/app/create/validator";
import {IMAGE_TYPE_DEFINITIONS} from "@/app/create/imageEditor";

interface LivePreviewProps {
	control: Control<CreateCharFormInputType>;
}

/* 유형별 이름은 imageEditor.ts 하나만 본다. 여기서 따로 적으면 이미지 편집
   모달에서 유형을 늘릴 때 미리보기 라벨만 조용히 뒤처진다. */
const LAYOUT_LABEL: Record<ProfileLayout, string> = {
	"": "프로필 미지정",
	h: `${IMAGE_TYPE_DEFINITIONS.h.label} 프로필`,
	v: `${IMAGE_TYPE_DEFINITIONS.v.label} 프로필`,
	s: `${IMAGE_TYPE_DEFINITIONS.s.label} 프로필`,
};

export default function LivePreview({control}: LivePreviewProps) {
	const layout = useWatch({
		name: "charProfileLayout",
		control,
	});

	return (
		<aside className={styles.preview} aria-label="캐릭터 프로필 미리보기">
			<div className={styles.label}>
				<span>실시간 미리보기</span>

				<span>{LAYOUT_LABEL[layout]}</span>
			</div>

			<ProfileSheet control={control} />
		</aside>
	);
}
