import {UseFormWatch} from "react-hook-form";
import styles from "./LivePreview.module.css";
import ProfileSheet, {type ProfileLayout} from "./ProfileSheet";
import {CreateCharFormInputType} from "@/app/create/validator";

interface LivePreviewProps {
	watch: UseFormWatch<CreateCharFormInputType>;
}

const LAYOUT_LABEL: Record<ProfileLayout, string> = {
	horizontal: "가로형 프로필",
	vertical: "세로형 프로필",
	square: "정사각형 프로필",
};

export default function LivePreview({watch}: LivePreviewProps) {
	const layout: ProfileLayout = "horizontal";

	return (
		<aside className={styles.preview} aria-label="캐릭터 프로필 미리보기">
			<div className={styles.label}>
				<span>실시간 미리보기</span>

				<span>{LAYOUT_LABEL[layout]}</span>
			</div>

			<ProfileSheet layout={layout} />
		</aside>
	);
}
