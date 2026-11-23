import styles from "../mylist/MyListEmpty.module.css";
import {LinkButton} from "@/components/ui/button";

/** none: 공개 프로필이 하나도 없음, search: 검색어에 맞는 게 없음 */
export type BrowseEmptyKind = "none" | "search";

const COPY: Readonly<Record<BrowseEmptyKind, {title: string; description: string}>> = {
	none: {title: "아직 공개된 프로필이 없어요.", description: "첫 번째로 프로필을 올려 보세요."},
	search: {title: "검색어에 맞는 프로필이 없어요.", description: "철자를 확인하거나 이름, 한 줄 소개의 일부만 넣어 보세요."},
};

const BUTTON_STYLE = {padding: "0 22px"} as const;

interface BrowseEmptyProps {
	kind: BrowseEmptyKind;
	isLoggedIn: boolean;
}

/* 모양은 /mylist의 빈 화면(MyListEmpty)과 같지만, 공개 프로필이 없으면 검색어 지우기 버튼을 넣지 않는다. 검색어 지우기 아래에, 로그인했으면 프로필 만들기를,
   로그아웃 상태면 회원가입을 둔다. 둘러보기에는 필터가 없어 "검색어 지우기"다. */
export default function BrowseEmpty({kind, isLoggedIn}: BrowseEmptyProps) {
	const {title, description} = COPY[kind];

	let message: string = "";

	if (isLoggedIn && kind === "search") {
		message = "찾는 캐릭터가 없으신가요?";
	} else if (!isLoggedIn) {
		message = "혹시 처음이신가요?";
	}

	return (
		<div className={styles.empty}>
			<i className={`bi ${kind === "none" ? "bi-person-plus" : "bi-search"}`} aria-hidden="true"></i>

			<h2>{title}</h2>

			<p>{description}</p>

			<div className={`${styles.actions}`}>
				{kind === "search" ? (
					<LinkButton href="/browse?page=1" width="fit-content" style={{...BUTTON_STYLE, display: "inline-flex"}} styleType="simple">
						검색어 지우기
					</LinkButton>
				) : null}

				<p>{message}</p>

				{isLoggedIn ? (
					<LinkButton href="/create" width="auto" style={BUTTON_STYLE} styleType={kind === "none" ? "attention" : "simple"}>
						프로필 만들기
					</LinkButton>
				) : (
					<LinkButton href="/signup" width="auto" style={BUTTON_STYLE} styleType={kind === "none" ? "attention" : "simple"}>
						회원가입
					</LinkButton>
				)}
			</div>
		</div>
	);
}
