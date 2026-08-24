import styles from "./HeroSection.module.css";
import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
	return (
		<article className={styles.hero}>
			<section className={styles.left}>
				<p className={styles.small_title}>자작 캐릭터 프로필 메이커</p>

				<h1>
					캐릭터의 핵심만,
					<br />한 장에.
				</h1>

				<p className={styles.detail_title}>몇 가지 정보만 적으면 읽기 쉽고 공유하기 좋은 캐릭터 프로필이 바로 완성됩니다.</p>

				<div className={styles.buttons}>
					<Link href="/">프로필 만들기</Link>

					<Link href="/">완성된 프로필 보기</Link>
				</div>
			</section>

			<section className={styles.right}>
				<div className={styles.bg}></div>

				<div className={styles.profile_card}>
					<div className={styles.head}>
						<div className={styles.profile}>
							<Image src="/test char.png" alt="캐릭터 이미지" width={130} height={130} />
						</div>

						<div className={styles.intro}>
							<p className={styles.name}>티아라</p>
							<p className={styles.message}>오늘도, 내일도 화이팅이야!</p>
						</div>
					</div>

					<div className={styles.like_personality}>
						<div className={styles.like}>
							<p>좋아하는 것</p>
							<p>무대 위에 서는 것</p>
						</div>

						<div className={styles.personality}>
							<p>성격</p>
							<p>밝고 긍정적인 노력가</p>
						</div>
					</div>
				</div>
			</section>
		</article>
	);
}
