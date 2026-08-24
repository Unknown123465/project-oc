import GuestMenu from "./GuestMenu";
import styles from "./Header.module.css";
import UserMenu from "./UserMenu";

export default async function Header() {
	return (
		<>
			<header className={styles.header}>
				<div className={styles.logo_box}>
					<div className={styles.logo}>OC</div>

					<span className={styles.brand}>프로젝트 OC</span>
				</div>

				{true ? <UserMenu /> : <GuestMenu />}
			</header>
		</>
	);
}
