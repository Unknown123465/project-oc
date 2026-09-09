import styles from "./Comments.module.css";

interface CommentItem {
	author: string;
	time: string;
	text: string;
}

const MOCK_COMMENTS: CommentItem[] = [
	{author: "푸른연필", time: "2시간 전", text: "한 문장 소개와 표정이 정말 잘 어울려요."},
	{author: "소금별", time: "어제", text: "머리핀을 만지는 습관이 귀엽네요!"},
];

export default function Comments() {
	return (
		<section className={styles.comments} aria-labelledby="comments-title">
			<h2 id="comments-title">
				코멘트 <span>{MOCK_COMMENTS.length}</span>
			</h2>

			<div className={styles.list}>
				{MOCK_COMMENTS.map((comment) => (
					<article key={comment.author} className={styles.comment}>
						<div className={styles.head}>
							<span className={styles.author}>{comment.author}</span>

							<span className={styles.time}>{comment.time}</span>
						</div>

						<p>{comment.text}</p>
					</article>
				))}
			</div>

			<form className={styles.form}>
				<label className={styles.field}>
					<span className={styles.field_label}>감상 남기기</span>

					<textarea className={styles.textarea} rows={3} maxLength={300} placeholder="캐릭터에 대한 따뜻한 감상을 적어 주세요." />
				</label>

				<div className={styles.form_actions}>
					<button type="submit" className={styles.submit}>
						코멘트 등록
					</button>
				</div>
			</form>
		</section>
	);
}
