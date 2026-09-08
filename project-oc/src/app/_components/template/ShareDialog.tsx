import styles from "./ShareDialog.module.css";

interface ShareDialogProps {
	uuid: string;
	characterName: string;
}

export default function ShareDialog({uuid, characterName}: ShareDialogProps) {
	return (
		<div className={styles.backdrop} aria-hidden="true">
			<section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="share-title">
				<div className={styles.head}>
					<div>
						<h2 id="share-title">프로필 공유</h2>

						<p>
							<strong>{characterName}</strong>의 프로필 링크를 복사합니다.
						</p>
					</div>

					<button type="button" className={styles.close} aria-label="닫기">
						×
					</button>
				</div>

				<div className={styles.body}>
					<button type="button" className={styles.copy} data-copy-path={`/template/${uuid}`}>
						링크 복사
					</button>
				</div>
			</section>
		</div>
	);
}
