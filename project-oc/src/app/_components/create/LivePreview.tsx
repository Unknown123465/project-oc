import {useWatch, type Control} from "react-hook-form";
import styles from "./LivePreview.module.css";
import ProfileSheet, {type ProfileLayout} from "./ProfileSheet";
import {CreateCharFormInputType} from "@/app/create/validator";

interface LivePreviewProps {
	control: Control<CreateCharFormInputType>;
}

const LAYOUT_LABEL: Record<ProfileLayout, string> = {
	"": "프로필 미지정",
	h: "가로형 프로필",
	v: "세로형 프로필",
	s: "정사각형 프로필",
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
