import styles from "./SuccessMark.module.css";

/** 가입이 끝났다는 표식. 문구를 읽기 전에 결과부터 눈에 들어오는 자리다. */
export default function SuccessMark() {
	return (
		<div className={styles.mark} aria-hidden="true">
			<i className="bi bi-check-lg"></i>
		</div>
	);
}
