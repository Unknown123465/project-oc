import styles from "./ProfileCard.module.css";
import CardImage from "./CardImage";
import CardIdentity from "./CardIdentity";
import CardAiNotice from "./CardAiNotice";
import CardFacts from "./CardFacts";
import CardBlocks from "./CardBlocks";
import CardTmi from "./CardTmi";
import {cardColorStyle, type ProfileCardLayoutProps} from "./cardCharacter";

/** 가로형: 위 줄은 이미지와 이름, 아래 줄은 정보와 블록, TMI. TMI가 정보 칩과 같은 높이에서 시작하도록 두 줄 격자로 나눈다. */
export default function ProfileCardHorizontal({character, imageDataURL}: ProfileCardLayoutProps) {
	return (
		<article className={`${styles.card} ${styles.layout_h}`} data-frame={character.charImageFrame} style={cardColorStyle(character.charColor)}>
			<div className={styles.sheet}>
				<CardImage character={character} charImage={imageDataURL.url} />

				<div className={styles.column}>
					<CardIdentity character={character} />

					<CardAiNotice character={character} />
				</div>

				<div className={styles.column}>
					<CardFacts character={character} />

					<CardBlocks character={character} />
				</div>

				<CardTmi character={character} />

				<p className={styles.brand}>프로젝트 OC</p>
			</div>
		</article>
	);
}
