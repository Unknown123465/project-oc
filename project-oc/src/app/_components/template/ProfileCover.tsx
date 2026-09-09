import Image from "next/image";
import styles from "./ProfileCover.module.css";
import type {ProfileLayout} from "./CharacterProfile";

interface ProfileCoverProps {
	layout: ProfileLayout;
	imageSrc: string;
	alt: string;
	color: string;
}

/* 레이아웃마다 원본 목업의 이미지 영역 비율이 달라 next/image에 넘길 intrinsic
   크기도 따로 필요하다. CSS만으로는 이 값을 대신할 수 없다. */
const IMAGE_SIZE: Record<ProfileLayout, {width: number; height: number}> = {
	h: {width: 980, height: 320},
	v: {width: 320, height: 620},
	s: {width: 330, height: 220},
};

const LAYOUT_CLASS: Record<ProfileLayout, string> = {
	h: styles.horizontal,
	v: styles.vertical,
	s: styles.square,
};

export default function ProfileCover({layout, imageSrc, alt, color}: ProfileCoverProps) {
	const {width, height} = IMAGE_SIZE[layout];

	return (
		<div className={`${styles.cover} ${LAYOUT_CLASS[layout]}`} style={{"--char-color": color}}>
			<Image src={imageSrc} alt={alt} width={width} height={height} loading="eager" className={styles.image} />
		</div>
	);
}
