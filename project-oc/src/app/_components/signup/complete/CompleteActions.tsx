import styles from "./CompleteActions.module.css";
import {LinkButton} from "@/components/ui/button";

/** 완료 화면에서 갈라지는 두 갈래. 이 페이지가 권하는 쪽은 프로필 만들기다. */
export default function CompleteActions() {
	return (
		<div className={styles.actions}>
			{/* TODO: 프로필 생성 페이지 완성 전까지 쓰는 임시 경로 */}
			<LinkButton href="/create">프로필 만들기</LinkButton>

			<LinkButton href="/" styleType="simple">
				홈으로
			</LinkButton>
		</div>
	);
}
