import styles from "./ProfileCard.module.css";
import type {CardCharacter} from "./cardCharacter";

interface CardAiNoticeProps {
	character: Pick<CardCharacter, "aiUsed">;
}

export default function CardAiNotice({character}: CardAiNoticeProps) {
	if (!character.aiUsed) {
		return null;
	}

	return (
		<p className={styles.ai_notice} role="note">
			<strong>AI 이미지 안내</strong>

			<span>AI를 사용한 이미지입니다.</span>
		</p>
	);
}
