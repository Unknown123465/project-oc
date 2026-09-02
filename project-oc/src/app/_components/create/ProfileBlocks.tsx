import styles from "./ProfileBlocks.module.css";

export default function ProfileBlocks() {
	return (
		<div className={styles.blocks}>
			<section className={styles.block}>
				<h3>좋아해요</h3>
				<p>좋아하는 것을 입력해 주세요.</p>
			</section>

			<section className={styles.block}>
				<h3>싫어해요</h3>
				<p>싫어하는 것을 입력해 주세요.</p>
			</section>

			<section className={styles.block_wide}>
				<h3>성격</h3>
				<p>성격을 간단히 소개해 주세요.</p>
			</section>

			<section className={styles.block_wide}>
				<h3>TMI</h3>
				<ul>
					<li>작은 습관이나 숨은 설정을 적어 주세요.</li>
				</ul>
			</section>

			<section className={styles.block_wide}>
				<h3>테마곡</h3>
				<p>테마곡 링크를 입력하면 여기에 표시돼요.</p>
			</section>
		</div>
	);
}
