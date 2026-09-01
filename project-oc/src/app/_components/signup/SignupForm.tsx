import styles from "./SignupForm.module.css";

export default function SignupForm() {
	return (
		<form className={styles.signup_form}>
			<div className={styles.field}>
				<label htmlFor="signup-email">이메일 주소</label>

				<div className={styles.box}>
					<input id="signup-email" name="email" type="email" placeholder="example@email.com" />
				</div>

				<p className={styles.field_error} />
			</div>

			<div className={styles.field}>
				<label htmlFor="signup-user-name">사용자 이름</label>

				<div className={styles.box}>
					<input id="signup-user-name" name="userName" type="text" placeholder="2~20자로 입력하세요" />
				</div>

				<p className={styles.field_error} />
			</div>

			<div className={styles.field}>
				<label htmlFor="signup-password">비밀번호</label>

				<div className={styles.box}>
					<input id="signup-password" name="password" type="password" placeholder="영문과 숫자를 조합해 주세요" />

					<button type="button" className={styles.eye}>
						보기
					</button>
				</div>

				<p className={styles.field_help}>6~20자의 영문과 숫자 조합</p>

				<p className={styles.field_error} />
			</div>

			<div className={styles.field}>
				<label htmlFor="signup-password-repeat">비밀번호 확인</label>

				<div className={styles.box}>
					<input id="signup-password-repeat" name="passwordRepeat" type="password" placeholder="비밀번호를 다시 입력하세요" />

					<button type="button" className={styles.eye}>
						보기
					</button>
				</div>

				<p className={styles.field_error} />
			</div>

			<button type="submit" className={styles.submit_button}>
				회원가입
			</button>
		</form>
	);
}
