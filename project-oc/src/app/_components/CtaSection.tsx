import {auth} from "@/auth/auth";
import styles from "./CtaSection.module.css";
import Link from "next/link";

export default async function CtaSection() {
	const authInfo = await auth();

	return (
		<article className={styles.cta}>
			<section>
				<b>
					설정만 쌓아 둔 캐릭터,
					<br />
					프로필부터 만들어 봐요.
				</b>

				<Link href={authInfo === null ? "/login?link=create" : "/create"}>프로필 만들기</Link>
			</section>
		</article>
	);
}
