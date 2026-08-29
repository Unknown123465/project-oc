"use client";

import {useEffect, useRef, useState} from "react";
import GuestMenu from "./GuestMenu";
import styles from "./Header.module.css";
import UserMenu from "./UserMenu";
import Link from "next/link";
import {useScrollLock} from "@/hooks/useScrollLock";

export default function Header() {
	const [menuOpen, setMenuOpen] = useState<boolean>(false);

	const navRef = useRef<HTMLElement>(null);

	const menuOpenChange = () => setMenuOpen((prev) => !prev);

	useScrollLock(menuOpen);

	useEffect(() => {
		if (menuOpen) {
			const abort = new AbortController();

			document.addEventListener(
				"pointerdown",
				(e) => {
					if (!navRef.current?.contains(e.target as Node)) {
						setMenuOpen(false);
					}
				},
				{signal: abort.signal},
			);

			document.addEventListener(
				"keydown",
				(e) => {
					if (e.key === "Escape") {
						setMenuOpen(false);
					}
				},
				{signal: abort.signal},
			);

			return () => {
				abort.abort();
			};
		}
	}, [menuOpen]);

	return (
		<>
			<header className={styles.header}>
				<Link href="/" className={styles.logo_box} aria-label="사이트 로고">
					<div className={styles.logo}>OC</div>

					<span className={styles.brand}>프로젝트 OC</span>
				</Link>

				<nav ref={navRef}>
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
