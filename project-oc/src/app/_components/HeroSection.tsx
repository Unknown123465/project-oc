import styles from "./HeroSection.module.css";
import Link from "next/link";
import Image from "next/image";
import {auth} from "@/auth/auth";
/* 정적 import로 쓰면 빌드 때 파일 내용 해시가 주소에 붙는다. 주소 문자열("/mainpage_card.png")로 쓰면
   이미지를 바꿔도 주소가 같아 next/image 서버 캐시(minimumCacheTTL 기본 4시간)가 예전 이미지를 계속 내준다. */
import mainpageCard from "../../../public/mainpage_card.png";

export default async function HeroSection() {
	const authInfo = await auth();

	return (
		<article className={styles.hero}>
			<section className={styles.left}>
				<p className={styles.small_title}>캐릭터 프로필 메이커</p>

				<h1>
					캐릭터 프로필,
					<br />
					칸만 채우면 끝나요.
				</h1>

				<p className={styles.detail_title}>이름이랑 성격, 좋아하는 것 정도만 적어 주세요. 꾸미는 건 사이트가 알아서 해요.</p>

				<div className={styles.buttons}>
					<Link href={authInfo !== null ? "/create" : "/login?link=create"}>프로필 만들기</Link>

					<Link href="/browse?page=1">완성된 프로필 보기</Link>
				</div>
			</section>

			<section className={styles.right}>
				<div className={styles.bg}></div>

				<figure className={styles.profile_card}>
					{/* 실제 프로필 카드 화면을 그대로 저장한 이미지. 최적화(WebP 변환, 폭별 축소)를 거쳐 캐시되도록 unoptimized는 쓰지 않는다. */}
					<Image
						src={mainpageCard}
						alt="프로젝트 OC로 만든 도마뇽의 프로필 카드"
						sizes="(width >= 876px) 600px, (width >= 768px) 560px, calc(100vw - 28px)"
						loading="eager"
					/>

					<figcaption>캐릭터 출처: 리슝좍.{"\n"}원작자에게 허락을 받아 사용됩니다.</figcaption>
				</figure>
			</section>
		</article>
	);
}
