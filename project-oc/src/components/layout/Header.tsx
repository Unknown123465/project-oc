import Link from "next/link";
import styles from "./Header.module.css";
import {auth} from "@/auth/auth";

interface MenuProps {
	isLogin: boolean;
	userName?: string | null;
}

function LeftMenu({isLogin}: MenuProps) {
	if (!isLogin) {
		return (
			<Link href="/" className={styles.text}>
				둘러보기
			</Link>
		);
	} else {
		return (
			<>
				<Link href="/" className={styles.text}>
					둘러보기
				</Link>

				<Link href="/my/template" className={styles.text}>
					내 템플릿
				</Link>

				<Link href="/create" className={styles.button}>
					<i className="bi bi-plus"></i> 템플릿 생성
				</Link>
			</>
		);
	}
}

function RightMenu({isLogin, userName}: MenuProps) {
	if (!isLogin) {
		return (
			<>
				<Link href="/login">로그인</Link>
				<Link href="/join">회원가입</Link>
			</>
		);
	} else {
		return (
			<>
				<div className={styles.username}>
					<span>{userName}</span>
					<span>&nbsp;&nbsp;작가님</span>
				</div>

				<Link href="/setting" className={styles.icon}>
					<i className="bi bi-gear-fill"></i>
				</Link>

				<Link href="/logout">로그아웃</Link>
			</>
		);
	}
}

export default async function Header() {
	const authInfo = await auth();

	return (
		<>
			<header className={styles.header}>
				<div className={styles.top}></div>

				<div className={styles.bottom}>
					<div className={styles.left}>
						<Link href="/" className={styles.logo}>
							<div className={styles.icon}></div>
							프로젝트 OC
						</Link>

						<LeftMenu isLogin={authInfo !== null} />
					</div>

					<div className={`${styles.right} ${authInfo !== null ? styles.logined : ""}`}>
						<label>
							자동
							<input type="radio" name="color-theme" defaultChecked value="auto" />
						</label>

						<label>
							밝게
							<input type="radio" name="color-theme" value="light" />
						</label>

						<label>
							어둡게
							<input type="radio" name="color-theme" value="dark" />
						</label>

						<RightMenu isLogin={authInfo !== null} userName={authInfo?.user?.name} />
					</div>
				</div>
			</header>

			<div aria-hidden className={styles.push}></div>
		</>
	);
}
