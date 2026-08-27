"use client";

import {useState} from "react";
import GuestMenu from "./GuestMenu";
import styles from "./Header.module.css";
import UserMenu from "./UserMenu";
import Link from "next/link";

export default function Header() {
	const [menuOpen, setMenuOpen] = useState<boolean>(false);

	const menuOpenChange = () => setMenuOpen((prev) => !prev);

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

					<div className={styles.menu} hidden={!menuOpen}>
						{true ? <UserMenu /> : <GuestMenu />}
					</div>
				</nav>
			</header>
		</>
	);
}
