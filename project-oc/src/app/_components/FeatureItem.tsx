import styles from "./FeatureItem.module.css";

interface FeatureItemProps {
	simpleTitle: string;
	description: string;
	detailDescription: string;
}

export default function FeatureItem({simpleTitle, description, detailDescription}: FeatureItemProps) {
	return (
		<section className={styles.feature}>
			<b className={styles.simple_title}>{simpleTitle}</b>

			<h3>{description}</h3>

			<p className={styles.detail_text}>{detailDescription}</p>
		</section>
	);
}
