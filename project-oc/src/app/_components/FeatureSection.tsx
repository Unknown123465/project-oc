import FeatureItem from "./FeatureItem";
import styles from "./FeatureSection.module.css";

export default function FeatureSection() {
	return (
		<article className={styles.feature_box}>
			<section className={styles.title}>
				<h2>
					꾸미느라 지치지 말고
					<br />
					캐릭터 얘기만 하세요.
				</h2>

				<p>뭘 적어야 할지는 미리 정해 뒀어요. 칸을 채우면 보기 좋은 한 장으로 정리돼요.</p>
			</section>

			<FeatureItem simpleTitle="칸 채우기" description="뭘 쓸지 고민 안 해도 돼요." detailDescription="이름, 한 줄 소개, 성격, 좋아하는 것과 싫어하는 것. 프로필에 꼭 들어가는 칸만 있어요." />

			<FeatureItem
				simpleTitle="링크로 공유"
				description="완성하면 링크 하나로 보여 줄 수 있어요."
				detailDescription="공개, 일부 공개, 비공개 중에 고르고 트위터나 커뮤니티에 링크를 붙이면 돼요."
			/>

			<FeatureItem simpleTitle="좋아요와 코멘트" description="본 사람이 감상을 남겨 줘요." detailDescription="로그인한 사람은 좋아요를 누르고 짧은 코멘트를 남길 수 있어요." />
		</article>
	);
}
