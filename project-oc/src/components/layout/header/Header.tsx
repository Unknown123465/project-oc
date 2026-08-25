import GuestMenu from "./GuestMenu";
import styles from "./Header.module.css";
import UserMenu from "./UserMenu";
import Link from "next/link";

export default function Header() {
	return (
		<>
			<header className={styles.header}>
				<Link href="/" className={styles.logo_box}>
					<div className={styles.logo}>OC</div>

					<span className={styles.brand}>프로젝트 OC</span>
				</Link>

				{/* TODO: 임시로 true/false 번갈아가며 ui 상태 확인. 추후 auth.js의 세션을 통해 적용 할 예정 */}
				{/* TODO: 추후에 태블릿, 모바일에 맞게 토글 메뉴로 전환 할 예정 */}
				{false ? <UserMenu /> : <GuestMenu />}
			</header>
		</>
	);
}
