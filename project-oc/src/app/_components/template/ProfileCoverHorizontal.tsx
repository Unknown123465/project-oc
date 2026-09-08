import Image from "next/image";
import styles from "./ProfileCoverHorizontal.module.css";

interface ProfileCoverHorizontalProps {
	imageSrc: string;
	alt: string;
	color: string;
}

export default function ProfileCoverHorizontal({imageSrc, alt, color}: ProfileCoverHorizontalProps) {
	return (
		<div className={styles.cover} style={{"--char-color": color}}>
			<Image src={imageSrc} alt={alt} width={980} height={320} loading="lazy" className={styles.image} />
		</div>
	);
}
