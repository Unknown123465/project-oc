import Image from "next/image";
import styles from "./Footer.module.css";
import UserMenu from "./UserMenu";
import GuestMenu from "./GuestMenu";

export default function Footer() {
	const year: number = new Date().getFullYear();

	return (
		<footer className={styles.footer}>
			<div className={styles.info}>
				<span className={styles.copyright}>ⓒ {year} 프로젝트 OC</span>

				<a href="https://github.com/Unknown123465" target="_blank" rel="noreferrer noopener" className={styles.logo}>
					<Image src="/github icon.png" alt="github 프로필" role="link" width={25} height={25} priority />
				</a>
			</div>

			{false ? <UserMenu /> : <GuestMenu />}
		</footer>
	);
}
