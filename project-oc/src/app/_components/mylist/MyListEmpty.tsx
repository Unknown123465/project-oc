import styles from "./MyListEmpty.module.css";
import {LinkButton} from "@/components/ui/button";
import {MyListPublicMode} from "./validator";

/** none: 만든 프로필이 하나도 없음, search: 검색어에 맞는 게 없음, filter: 공개 여부 조건에 맞는 게 없음 */
export type MyListEmptyKind = "none" | "search" | "filter";

interface CopyValue {
	title: string;
	description: string;
}

const REPLACE_KEYWORD = {
	public_mode: "{PUBLIC_MODE}",
} as const;

const COPY: Readonly<Record<MyListEmptyKind, CopyValue>> = {
	none: {title: "아직 만든 프로필이 없어요.", description: "몇 칸만 채우면 첫 프로필이 완성돼요."},
	search: {title: "검색어에 맞는 프로필이 없어요.", description: "철자를 확인하거나 이름, 한 줄 소개의 일부만 넣어 보세요."},
	filter: {title: `만든 ${REPLACE_KEYWORD.public_mode} 프로필이 없어요.`, description: "프로필 공개 여부를 전체로 바꾸면 모두 볼 수 있어요."},
};

const PUBLIC_MODE_REPLACE_VALUE: Readonly<Record<Exclude<MyListPublicMode, "all">, string>> = {
	public: "공개",
	link: "일부 공개",
	private: "비공개",
};

interface MyListEmptyProps {
	kind: MyListEmptyKind;
	public_mode: MyListPublicMode;
}

export default function MyListEmpty({kind, public_mode}: MyListEmptyProps) {
	const {title, description} = COPY[kind];

	let finalTitle: string = title;

	if (kind === "filter" && public_mode !== "all") {
		finalTitle = finalTitle.replaceAll(REPLACE_KEYWORD.public_mode, PUBLIC_MODE_REPLACE_VALUE[public_mode]);
	}

	return (
		<div className={styles.empty}>
			<i className={`bi ${kind === "none" ? "bi-person-plus" : "bi-search"}`} aria-hidden="true"></i>

			<h2>{finalTitle}</h2>

			<p>{description}</p>

			{kind === "none" ? (
				<LinkButton href="/create" width="auto" style={{padding: "0 22px"}}>
					프로필 만들기
				</LinkButton>
			) : (
				<LinkButton href="/mylist?page=1" width="auto" style={{padding: "0 22px"}} styleType="simple">
					검색어와 필터 지우기
				</LinkButton>
			)}
		</div>
	);
}
