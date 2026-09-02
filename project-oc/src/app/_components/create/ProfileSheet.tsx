import styles from "./ProfileSheet.module.css";
import ProfileFacts from "./ProfileFacts";
import ProfileBlocks from "./ProfileBlocks";

export type ProfileLayout = "horizontal" | "vertical" | "square";

const LAYOUT_CLASS: Record<ProfileLayout, string> = {
	horizontal: "",
	vertical: styles.layout_vertical,
	square: styles.layout_square,
};

export default function ProfileSheet({layout}: {layout: ProfileLayout}) {
	return (
		<article className={`${styles.sheet} ${LAYOUT_CLASS[layout]}`}>
			<div className={styles.hero_grid}>
				<div className={styles.cover}>
					<img className={styles.cover_image} alt="캐릭터 프로필 이미지" />
				</div>

				<div className={styles.inner}>
					<div className={styles.identity}>
						<h2>캐릭터 이름</h2>

						<p>이 캐릭터를 한 문장으로 소개해 주세요.</p>
					</div>

					<ProfileFacts />

					<ProfileBlocks />
				</div>
			</div>
		</article>
	);
}
