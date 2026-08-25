"use client";

import {useCallback, useMemo, useState} from "react";
import GuestMenu from "./GuestMenu";
import styles from "./Header.module.css";
import UserMenu from "./UserMenu";
import Link from "next/link";

export default function Header() {
	const [menuOpen, setMenuOpen] = useState<boolean>(false);

	const menuOpenChange = useCallback(() => {
		setMenuOpen((prev) => !prev);
	}, []);

	const printMenu = useMemo(() => {
		if (menuOpen) {
			//TODO: 임시로 true/false 번갈아가며 ui 상태 확인. 추후 auth.js의 세션을 통해 적용 할 예정
			return false ? <UserMenu /> : <GuestMenu />;
		} else {
			return null;
		}
	}, [menuOpen]);

	return (
		<>
			<header className={styles.header}>
				<Link href="/" className={styles.logo_box} aria-label="사이트 로고">
					<div className={styles.logo}>OC</div>

					<span className={styles.brand}>프로젝트 OC</span>
				</Link>

				<nav>
					<button type="button" className={styles.toggle_button} aria-expanded={menuOpen} onClick={menuOpenChange}>
						{menuOpen ? "닫기" : "메뉴"}
					</button>

					{printMenu}
				</nav>
			</header>
		</>
	);
}
