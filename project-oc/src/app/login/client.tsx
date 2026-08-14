"use client";

import styles from "./page.module.css";
import {PasswordInput, TextInput} from "../component/form/input";
import {SubmitButton} from "../component/form/button";

export function LoginForm() {
	return (
		<form className={styles.login_form}>
			<p>사용자 이름</p>

			<TextInput name="userName" value="" onChange={() => {}} />

			<p>사용자 비밀번호</p>

			<PasswordInput name="password" value="" onChange={() => {}} />

			<SubmitButton width="100%" className={styles.submit_button}>
				로그인
			</SubmitButton>
		</form>
	);
}
