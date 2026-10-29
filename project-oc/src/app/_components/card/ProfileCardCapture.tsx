import type {Ref} from "react";
import styles from "./ProfileCard.module.css";
import ProfileCard from "./ProfileCard";
import type {CardCharacter, ProfileCardLayoutProps} from "./cardCharacter";

interface ProfileCardCaptureProps extends ProfileCardLayoutProps {
	/** PNG로 찍을 1280 × 720 틀. 기기와 상관없이 PC 화면 기준(축소 없음)으로 찍는다. */
	captureRef: Ref<HTMLDivElement>;
	character: CardCharacter;
}

/** PNG 저장용 카드. 화면 밖에 두고 같은 유형별 컴포넌트를 1280 × 720 고정 틀에 넣어 찍는다. */
export default function ProfileCardCapture({captureRef, character, imageDataURL}: ProfileCardCaptureProps) {
	return (
		<div className={styles.capture} aria-hidden="true" inert>
			<div ref={captureRef} className={styles.capture_frame}>
				<ProfileCard character={character} imageDataURL={imageDataURL} />
			</div>
		</div>
	);
}
