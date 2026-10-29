"use client";

import styles from "./ProfileCard.module.css";
import type {CardCharacter} from "./cardCharacter";

interface CardImageProps {
	character: Pick<CardCharacter, "charName" | "charImage">;
	charImage: string | null;
}

export default function CardImage({character, charImage}: CardImageProps) {
	return (
		<div className={styles.image} aria-busy={charImage === null}>
			{charImage !== null ? (
				/* eslint-disable-next-line @next/next/no-img-element -- data: URL이라 next/image 최적화 대상이 아님 */
				<img src={charImage} alt={`${character.charName} 캐릭터 일러스트`} />
			) : null}
		</div>
	);
}
