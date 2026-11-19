import styles from "./page.module.css";
import type {Metadata} from "next";
import SettingNav from "@/app/_components/setting/SettingNav";
import GeneralSection from "@/app/_components/setting/GeneralSection";
import PlaybackSection from "@/app/_components/setting/PlaybackSection";
import ActivitySection from "@/app/_components/setting/ActivitySection";
import DangerSection from "@/app/_components/setting/DangerSection";
import type {SettingAccount, SettingActivity} from "@/app/setting/validator";
import {getMyAccountInfo} from "./getAccountInfo";
import {getMyRankList} from "./getRankList";
import {unauthorized} from "next/navigation";

/* 로그인한 사용자 본인만 보는 페이지라 검색에 노출하지 않는다. */
export const metadata: Metadata = {
	title: "계정 설정 - 프로젝트 OC",
	robots: "noindex",
};

export default async function SettingPage() {
	const [accountInfo, rankList] = await Promise.all([getMyAccountInfo(), getMyRankList()]);

	if (!accountInfo.success || !rankList.success) {
		unauthorized();
	}

	return (
		<main className={styles.main}>
			<h1>계정 설정</h1>

			<div className={styles.layout}>
				<SettingNav />

				<div className={styles.sections}>
					<GeneralSection account={accountInfo.result} />
					<PlaybackSection key={String(accountInfo.result.autoplayMusic)} autoplayMusic={accountInfo.result.autoplayMusic} />
					<ActivitySection activity={rankList.result} />
					<DangerSection username={accountInfo.result.username} />
				</div>
			</div>
		</main>
	);
}
