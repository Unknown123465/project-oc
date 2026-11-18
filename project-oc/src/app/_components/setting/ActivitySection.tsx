import styles from "./SettingSection.module.css";
import Link from "next/link";
import type {SettingActivity, SettingRankItem} from "../../setting/validator";

interface ActivitySectionProps {
	activity: SettingActivity;
}

interface RankingProps {
	title: string;
	items: SettingRankItem[];
	emptyText: string;
}

function Ranking({title, items, emptyText}: RankingProps) {
	return (
		<section className={styles.ranking}>
			<h3>{title}</h3>

			{items.length > 0 ? (
				<ol>
					{items.map((item, index) => (
						<li key={item.uuid}>
							<span className={styles.rank}>{index + 1}</span>
							<Link href={`/template/${item.uuid}`} className={styles.name}>
								{item.name}
							</Link>
							<span className={styles.count}>{item.count.toLocaleString("ko-KR")}개</span>
						</li>
					))}
				</ol>
			) : (
				<p className={styles.empty}>{emptyText}</p>
			)}
		</section>
	);
}

export default function ActivitySection({activity}: ActivitySectionProps) {
	const {profileCount, likeCount, commentCount, likeTop, commentTop} = activity;

	return (
		<section id="activity" className={styles.section} aria-labelledby="setting-activity-title">
			<h2 id="setting-activity-title">내 활동</h2>

			<dl className={styles.stats}>
				<div>
					<dt>만든 프로필</dt>
					<dd>{profileCount.toLocaleString("ko-KR")}</dd>
				</div>
				<div>
					<dt>받은 좋아요</dt>
					<dd>{likeCount.toLocaleString("ko-KR")}</dd>
				</div>
				<div>
					<dt>받은 코멘트</dt>
					<dd>{commentCount.toLocaleString("ko-KR")}</dd>
				</div>
			</dl>

			<div className={styles.rankings}>
				<Ranking title="좋아요 TOP 5" items={likeTop} emptyText="아직 받은 좋아요가 없어요." />
				<Ranking title="코멘트 TOP 5" items={commentTop} emptyText="아직 받은 코멘트가 없어요." />
			</div>
		</section>
	);
}
