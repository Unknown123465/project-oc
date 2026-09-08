import Image from "next/image";
import styles from "./ProfileCoverVertical.module.css";

interface ProfileCoverVerticalProps {
	imageSrc: string;
	alt: string;
	color: string;
}

export default function ProfileCoverVertical({imageSrc, alt, color}: ProfileCoverVerticalProps) {
	return (
		<div className={styles.cover} style={{"--char-color": color}}>
			<Image src={imageSrc} alt={alt} width={400} height={560} className={styles.image} />
		</div>
	);
}
