import styles from "./SettingSection.module.css";
import {ActionButton} from "@/components/ui/button";

/* 버튼은 아직 목업이다. 눌러도 아무 일이 없고, 아래 안내 문구로 알린다. */
export default function DangerSection() {
	return (
		<section id="danger" className={`${styles.section} ${styles.danger}`} aria-labelledby="setting-danger-title">
			<h2 id="setting-danger-title">위험 구역</h2>

			<dl className={styles.rows}>
				<div className={styles.row}>
					<dt>프로필 모두 삭제</dt>
					<dd className={styles.value}>
						<span className={styles.text}>만든 프로필과 받은 좋아요, 코멘트가 함께 지워져요.</span>
					</dd>
					<dd className={styles.action}>
						<ActionButton styleType="danger">모두 삭제</ActionButton>
					</dd>
				</div>

				<div className={styles.row}>
					<dt>계정 삭제</dt>
					<dd className={styles.value}>
						<span className={styles.text}>계정과 모든 데이터가 지워지고 되돌릴 수 없어요.</span>
					</dd>
					<dd className={styles.action}>
						<ActionButton styleType="danger">계정 삭제</ActionButton>
					</dd>
				</div>
			</dl>

			<p className={styles.notice}>
				<i className="bi bi-info-circle" aria-hidden="true"></i>
				삭제 기능은 아직 준비 중이에요. 지금은 버튼을 눌러도 지워지지 않아요.
			</p>
		</section>
	);
}
