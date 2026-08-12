import Image from "next/image";
import styles from "./page.module.css";
import Link from "next/link";
import { ReactNode } from "react";

function BgCircle({ size, boundary, fill, pos }: { size: "big" | "small"; boundary: "soft" | "hard"; fill: "bg" | "stroke"; pos: "top" | "left" | "right" }) {
    const classList: string[] = [];

    if (size === "big") {
        classList.push(styles.big);
    } else {
        classList.push(styles.small);
    }

    if (boundary === "soft") {
        classList.push(styles.soft);
    } else {
        classList.push(styles.hard);
    }

    if (fill === "bg") {
        classList.push(styles.fill_bg);
    } else {
        classList.push(styles.fill_stroke);
    }

    if (pos === "left") {
        classList.push(styles.left);
    } else if (pos === "right") {
        classList.push(styles.right);
    } else {
        classList.push(styles.top);
    }

    return <div className={`${styles.bg} ${styles.circle} ${classList.join(" ")}`}></div>;
}

function BgPicture({ pos }: { pos: "left" | "right" }) {
    return (
        <div className={`${styles.bg} ${styles.profile} ${pos === "left" ? styles.left : styles.right}`}>
            <div className={styles.picture}>
                <div className={styles.person}></div>
            </div>

            <div className={styles.line}>
                <div></div>
                <div></div>
            </div>
        </div>
    );
}

function FeatureText({ menu, title, children }: { menu: string; title: string; children: ReactNode }) {
    return (
        <div className={styles.info}>
            <div className={styles.menu}>{menu}</div>
            <h2>{title}</h2>
            <div className={styles.content}>{children}</div>
        </div>
    );
}

function Feature({ children }: { children: ReactNode }) {
    return <section>{children}</section>;
}

export default function Page() {
    return (
        <main className={styles.main}>
            <article className={styles.head} role="heading" aria-level={1}>
                <BgCircle size="big" boundary="soft" fill="bg" pos="top" />

                <BgPicture pos="left" />
                <BgPicture pos="right" />

                <BgCircle size="small" boundary="hard" fill="bg" pos="left" />
                <BgCircle size="small" boundary="hard" fill="stroke" pos="right" />

                <div className={styles.title} role="title">
                    <h1>
                        간단하고 명확한
                        <br />
                        프로필 <span>메이커</span>
                    </h1>

                    <p>
                        프로젝트OC로 통일된 캐릭터 프로필을 만들어 보세요.
                        <br />
                        프로젝트OC는 SNS, 커뮤니티에 특화된 캐릭터 프로필 제작 도구 입니다.
                    </p>
                </div>

                <div className={styles.make_start}>
                    <Link href="/make-start">나만의 캐릭터 프로필 만들기</Link>
                </div>
            </article>

            <hr />

            <article className={styles.feature}>
                <Feature>
                    <Image src="" alt="기능1" />
                    <FeatureText menu="TEMPLATE" title="간단한 템플릿으로 캐릭터 프로필을 만들어 보세요.">
                        캐릭터 프로필을 만들 때 어떤 요소를 넣어야 할지, 어떻게 꾸며야 할지 많은 고민을 해보셨을겁니다. 프로젝트OC를 사용하면 프로필에 자주 사용한 요소와 깔끔한 디자인으로 독자들이 한
                        눈에 바로 이해 할 수 있는 캐릭터 프로필이 뚝딱! 만들어집니다.
                    </FeatureText>
                </Feature>
            </article>
        </main>
    );
}
