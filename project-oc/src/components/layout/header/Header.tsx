import GuestMenu from "./GuestMenu";
import styles from "./Header.module.css";
import UserMenu from "./UserMenu";
import Link from "next/link";

export default async function Header() {
	return (
		<>
			<header className={styles.header}>
				<Link href="/" className={styles.logo_box}>
					<div className={styles.logo}>OC</div>

					<span className={styles.brand}>프로젝트 OC</span>
				</Link>

				{false ? <UserMenu /> : <GuestMenu />}
			</header>
		</>
	);
}
