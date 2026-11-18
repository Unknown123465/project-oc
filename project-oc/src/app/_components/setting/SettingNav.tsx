import styles from "./SettingNav.module.css";
import {SETTING_SECTIONS} from "../../setting/validator";

/* 해시 링크라 JS 없이 이동한다. 지금 보고 있는 항목 표시는
   CSS의 :target으로 처리한다(SettingNav.module.css). */
export default function SettingNav() {
	return (
		<nav className={styles.nav} aria-label="설정 항목">
			{SETTING_SECTIONS.map(({id, label}) => (
				<a key={id} href={`#${id}`} data-section={id}>
					{label}
				</a>
			))}
		</nav>
	);
}
