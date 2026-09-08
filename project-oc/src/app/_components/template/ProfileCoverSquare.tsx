import Image from "next/image";
import styles from "./ProfileCoverSquare.module.css";

interface ProfileCoverSquareProps {
	imageSrc: string;
	alt: string;
	color: string;
}

export default function ProfileCoverSquare({imageSrc, alt, color}: ProfileCoverSquareProps) {
	return (
		<div className={styles.cover} style={{"--char-color": color}}>
			<Image src={imageSrc} alt={alt} width={330} height={220} loading="lazy" className={styles.image} />
		</div>
	);
}
