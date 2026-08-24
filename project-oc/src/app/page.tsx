import Image from "next/image";
import styles from "./page.module.css";
import Link from "next/link";
import {ReactNode} from "react";

export default function Page() {
	return (
		<main className={styles.main}>
			<article className={styles.header}>
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

			<article className={styles.feature_box}>
				<section className={styles.title}>
					<h2>
						꾸미는 시간보다
						<br />
						캐릭터를 이야기하는 시간.
					</h2>

					<p>필요한 항목을 이미 정리해 두었습니다. 사용자는 작성하고, 프로젝트 OC는 보기 좋은 한 장으로 정돈합니다.</p>
				</section>

				<section className={styles.feature}>
					<b className={styles.simple_title}>간단한 입력</b>

					<h3>고민 없이 작성합니다.</h3>

					<p className={styles.detail_text}>이름, 한 줄 소개, 성격과 취향처럼 캐릭터를 이해하는 데 필요한 항목만 제공합니다.</p>
				</section>

				<section className={styles.feature}>
					<b className={styles.simple_title}>바로 공유</b>

					<h3>완성된 프로필을 건넵니다.</h3>

					<p className={styles.detail_text}>공개, 링크 공개, 비공개 중 원하는 방식을 고르고 SNS와 커뮤니티에 공유할 수 있습니다.</p>
				</section>

				<section className={styles.feature}>
					<b className={styles.simple_title}>함께 감상</b>

					<h3>좋아요와 코멘트를 받습니다.</h3>

					<p className={styles.detail_text}>독자는 로그인 없이 좋아요를 남기고, 로그인 후 창작자에게 짧은 감상을 전할 수 있습니다.</p>
				</section>
			</article>

			<article className={styles.footer}>
				<section>
					<b>
						당신의 캐릭터를
						<br />
						가볍게 소개해 보세요.
					</b>

					<Link href="/login">무료로 시작하기</Link>
				</section>
			</article>
		</main>
	);
}
