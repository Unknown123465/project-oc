import FeatureItem from "./FeatureItem";
import styles from "./FeatureSection.module.css";

export default function FeatureSection() {
	return (
		<article className={styles.feature_box}>
			<section className={styles.title}>
				<h2>
					꾸미는 시간보다
					<br />
					캐릭터를 이야기하는 시간.
				</h2>

				<p>필요한 항목을 이미 정리해 두었습니다. 사용자는 작성하고, 프로젝트 OC는 보기 좋은 한 장으로 정돈합니다.</p>
			</section>

			<FeatureItem simpleTitle="간단한 입력" description="고민 없이 작성합니다." detailDescription="이름, 한 줄 소개, 성격과 취향처럼 캐릭터를 이해하는 데 필요한 항목만 제공합니다." />

			<FeatureItem simpleTitle="바로 공유" description="완성된 프로필을 건넵니다." detailDescription="공개, 링크 공개, 비공개 중 원하는 방식을 고르고 SNS와 커뮤니티에 공유할 수 있습니다." />

			<FeatureItem simpleTitle="함께 감상" description="좋아요와 코멘트를 받습니다." detailDescription="독자는 로그인 없이 좋아요를 남기고, 로그인 후 창작자에게 짧은 감상을 전할 수 있습니다." />
		</article>
	);
}
