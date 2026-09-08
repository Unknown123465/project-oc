import Link from "next/link";
import styles from "./ProfileActions.module.css";

interface ProfileActionsProps {
	likeCount: number;
}

export default function ProfileActions({likeCount}: ProfileActionsProps) {
	return (
		<div className={styles.actions}>
			<Link href="/" className={styles.back_link}>
				← 둘러보기
			</Link>

			<div className={styles.group}>
				<button type="button" className={styles.pill} aria-pressed="false">
					<i className="bi bi-heart"></i> <span>{likeCount}</span>
				</button>

				<button type="button" className={styles.pill}>
					공유
				</button>
			</div>
		</div>
	);
}
