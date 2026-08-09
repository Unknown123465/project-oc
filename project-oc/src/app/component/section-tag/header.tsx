import Link from "next/link";
import styles from "./header.module.css";

export default function Header() {
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

                        <Link href="/" className={styles.text}>
                            둘러보기
                        </Link>
                    </div>

                    <div className={styles.right}>
                        <Link href="/login">로그인</Link>
                        <Link href="/join">회원가입</Link>
                    </div>
                </div>
            </header>
            <div aria-hidden className={styles.push}></div>
        </>
    );
}
