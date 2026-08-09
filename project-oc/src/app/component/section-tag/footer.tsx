import Image from "next/image";
import styles from "./footer.module.css";

export default function Footer() {
    const year: number = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.left}>
                <span className={styles.copyright}>ⓒ {year} Unknown123465 / 프로젝트 OC</span>

                <div className={styles.icon}>
                    <a href="https://github.com/Unknown123465" target="_blank" rel="noreferrer noopener">
                        <Image src="/github icon.png" alt="github 프로필" role="link" width={25} height={25} priority />
                    </a>
                </div>
            </div>

            <div className={styles.right}>
                <a href="/lincese" target="_blank" rel="noreferrer noopener">
                    오픈소스 라이선스
                </a>
            </div>
        </footer>
    );
}
