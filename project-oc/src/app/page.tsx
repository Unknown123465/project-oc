import CtaSection from "./_components/CtaSection";
import FeatureSection from "./_components/FeatureSection";
import HeroSection from "./_components/HeroSection";
import styles from "./page.module.css";

export default function Page() {
	return (
		<main className={styles.main}>
			<HeroSection />
			<FeatureSection />
			<CtaSection />
		</main>
	);
}
