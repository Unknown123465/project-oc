import Image from "next/image";
import styles from "./ProfileCover.module.css";
import type {ProfileLayout} from "./CharacterProfile";

interface ProfileCoverProps {
	layout: ProfileLayout;
	imageSrc: string;
	alt: string;
	color: string;
	/** 일부공개·비공개 이미지는 next/image 최적화 캐시를 거치지 않는다. 그 캐시는 서명이 만료되거나
	 *  비공개로 바뀐 뒤에도 minimumCacheTTL(기본 4시간) 동안 이미지를 내주기 때문이다. */
	unoptimized?: boolean;
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

export default function ProfileCover({layout, imageSrc, alt, color, unoptimized = false}: ProfileCoverProps) {
	const {width, height} = IMAGE_SIZE[layout];

	return (
		<div className={`${styles.cover} ${LAYOUT_CLASS[layout]}`} style={{"--char-color": color}}>
			<Image src={imageSrc} alt={alt} width={width} height={height} loading="eager" unoptimized={unoptimized} className={styles.image} />
		</div>
	);
}
