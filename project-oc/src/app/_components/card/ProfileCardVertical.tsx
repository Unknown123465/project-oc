import styles from "./ProfileCard.module.css";
import CardImage from "./CardImage";
import CardIdentity from "./CardIdentity";
import CardAiNotice from "./CardAiNotice";
import CardFacts from "./CardFacts";
import CardBlocks from "./CardBlocks";
import CardTmi from "./CardTmi";
import {cardColorStyle, type ProfileCardLayoutProps} from "./cardCharacter";

/** 세로형: 이미지 왼쪽, 나머지 요소는 오른쪽 한 열 */
export default function ProfileCardVertical({character, imageDataURL}: ProfileCardLayoutProps) {
	return (
		<article className={`${styles.card} ${styles.layout_v}`} data-frame={character.charImageFrame} style={cardColorStyle(character.charColor)}>
			<div className={styles.sheet}>
				<CardImage character={character} charImage={imageDataURL.url} />

				<div className={styles.column}>
					<CardIdentity character={character} />

					<CardAiNotice character={character} />

					<CardFacts character={character} />

					<CardBlocks character={character} />

					<CardTmi character={character} />
				</div>

				<p className={styles.brand}>프로젝트 OC</p>
			</div>
		</article>
	);
}
