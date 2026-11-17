import styles from "./SettingSection.module.css";
import {ActionButton} from "@/components/ui/button";
import type {SettingAccount} from "../../setting/validator";

interface GeneralSectionProps {
	account: SettingAccount;
}

/* 변경 버튼은 아직 목업이다. 눌러도 아무 일이 없고, 아래 안내 문구로 알린다. */
export default function GeneralSection({account}: GeneralSectionProps) {
	const {email, username, socialProvider} = account;

	const isSocial: boolean = socialProvider !== "일반" && socialProvider !== "알 수 없음";

	return (
		<section id="general" className={styles.section} aria-labelledby="setting-general-title">
			<h2 id="setting-general-title">일반</h2>

			<dl className={styles.rows}>
				<div className={styles.row}>
					<dt>이메일</dt>
					<dd className={styles.value}>
						{email !== null ? <span className={styles.text}>{email}</span> : <span className={styles.empty}>등록된 이메일이 없어요.</span>}
						{isSocial ? <small>{socialProvider} 계정으로 가입해서 이메일은 바꿀 수 없어요.</small> : null}
					</dd>

					{!isSocial ? (
						<dd className={styles.action}>
							<ActionButton>변경</ActionButton>
						</dd>
					) : null}
				</div>

				<div className={styles.row}>
					<dt>사용자 이름</dt>

					<dd className={styles.value}>
						<span className={styles.text}>{username}</span>
						{!isSocial ? <small>로그인할 때 쓰는 이름이에요.</small> : null}
					</dd>
					<dd className={styles.action}>
						<ActionButton>변경</ActionButton>
					</dd>
				</div>

				{!isSocial ? (
					<div className={styles.row}>
						<dt>비밀번호</dt>
						<dd className={styles.value}>
							<span className={styles.text}>••••••••</span>
						</dd>
						<dd className={styles.action}>
							<ActionButton>변경</ActionButton>
						</dd>
					</div>
				) : null}
			</dl>

			<p className={styles.notice}>
				<i className="bi bi-info-circle" aria-hidden="true"></i>
				{isSocial ? "사용자 이름 변경은" : "이메일, 사용자 이름, 비밀번호 변경은"} 아직 준비 중이에요. 지금은 버튼을 눌러도 바뀌지 않아요.
			</p>
		</section>
	);
}
