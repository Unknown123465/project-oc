import styles from "./page.module.css";

export default function Signup() {
	return (
		<main className={styles.main}>
			<section className={styles.aside}>
				<h1>
					몇 가지만 적으면
					<br />
					프로필 완성.
				</h1>

				<p>프로젝트 OC에 가입하고 첫 번째 캐릭터 프로필을 만들어 보세요. 기본 기능은 무료입니다.</p>
			</section>

			<section className={styles.form_area}>
				<article className={styles.form_box}>
					<h2>회원가입</h2>

					<p className={styles.lead}>당신의 캐릭터를 소개할 준비를 시작합니다.</p>

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

					<p className={styles.terms}>가입하면 프로젝트 OC의 이용 정책과 개인정보 처리방침에 동의하게 됩니다.</p>

					<div className={styles.sub_links}>
						<button type="button" disabled>
							이미 계정이 있으신가요?
						</button>
					</div>
				</article>
			</section>
		</main>
	);
}
