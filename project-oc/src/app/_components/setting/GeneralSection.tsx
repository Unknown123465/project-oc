import styles from "./SettingSection.module.css";
import {LinkButton} from "@/components/ui/button";
import type {SettingAccount} from "../../setting/validator";
import EmailRow from "./EmailRow";
import UserNameRow from "./UserNameRow";

interface GeneralSectionProps {
	account: SettingAccount;
}

export default function GeneralSection({account}: GeneralSectionProps) {
	const {email, username, socialProvider} = account;

	const isSocial: boolean = socialProvider !== "일반" && socialProvider !== "알 수 없음";

	return (
		<section id="general" className={styles.section} aria-labelledby="setting-general-title">
			<h2 id="setting-general-title">일반</h2>

			<dl className={styles.rows}>
				<EmailRow email={email} socialProviderName={isSocial ? socialProvider : null} />

				<UserNameRow username={username} isSocial={isSocial} />

				{!isSocial ? (
					<div className={styles.row}>
						<dt>비밀번호</dt>
						<dd className={styles.value}>
							<span className={styles.text}>••••••••</span>
							<small>바꾸면 모든 기기에서 로그아웃돼요.</small>
						</dd>
						<dd className={styles.action}>
							<LinkButton href="/setting/changepw" styleType="simple" className={styles.link_button}>
								변경
							</LinkButton>
						</dd>
					</div>
				) : null}
			</dl>
		</section>
	);
}
