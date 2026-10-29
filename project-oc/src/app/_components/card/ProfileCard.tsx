import ProfileCardVertical from "./ProfileCardVertical";
import ProfileCardHorizontal from "./ProfileCardHorizontal";
import ProfileCardSquare from "./ProfileCardSquare";
import type {ProfileCardLayoutProps} from "./cardCharacter";
import styles from "./ProfileCard.module.css";

/** 화면에 보이는 카드. 1280px보다 좁은 화면에서는 카드를 통째로 줄여 보여 준다.
   프로필 유형에 맞는 카드 하나를 고른다. 화면용과 저장용이 같이 쓴다. */
export default function ProfileCard({character, imageDataURL}: ProfileCardLayoutProps) {
	let card;

	switch (character.charProfileLayout) {
		case "v":
			card = <ProfileCardVertical character={character} imageDataURL={imageDataURL} />;

			break;

		case "s":
			card = <ProfileCardSquare character={character} imageDataURL={imageDataURL} />;

			break;

		case "h":
			card = <ProfileCardHorizontal character={character} imageDataURL={imageDataURL} />;

			break;

		default:
			card = null;
	}

	return <div className={styles.display}>{card}</div>;
}
