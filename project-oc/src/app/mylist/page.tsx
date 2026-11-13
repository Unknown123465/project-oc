import styles from "./page.module.css";
import {LinkButton} from "@/components/ui/button";
import {MAX_TEMPLATE_LIMIT} from "@/app/create/validator";
import MyListToolbar from "@/app/_components/mylist/MyListToolbar";
import MyCharacterTile from "@/app/_components/mylist/MyCharacterTile";
import MyListPagination from "@/app/_components/mylist/MyListPagination";
import MyListEmpty, {type MyListEmptyKind} from "@/app/_components/mylist/MyListEmpty";
import {myListQueryForm, type MyListQueryFormType} from "@/app/_components/mylist/validator";
import {getCharactersAsMyList, MAX_PAGINATION_TILE} from "../template/[uuid]/getCharacter";
import {redirect, unauthorized} from "next/navigation";
import {toEmptyKind} from "./toEmptyKind";
import {headers} from "next/headers";

/* 한 줄 열 수(4, 3, 2)로 모두 나누어떨어지게 12개씩 보여 준다. */
const FIRST_ROW_COUNT = 4 as const;

export default async function MyListPage({searchParams}: PageProps<"/mylist">) {
	const params = await searchParams;

	const characters = await getCharactersAsMyList(params);

	if (!characters.success) {
		const {reason, redirectQuery} = characters;

		if (reason === "notLoggedIn") {
			unauthorized();
		} else if (redirectQuery) {
			redirect("/mylist" + redirectQuery, "replace");
		}
	}

	const nonce: string | null = (await headers()).get("x-nonce");

	const check = myListQueryForm.safeParse(params);

	const query: MyListQueryFormType = check.success ? check.data : {page: 1, keyword: "", sort: "latest", public_mode: "all"};
	/** 조건과 무관하게 이 사용자가 만든 프로필 수. 상한 대비 표시에 쓴다. */
	const totalCount: number = characters.success ? characters.result.allCount : 0;
	const lastPage: number = characters.success ? Math.max(Math.ceil(characters.result.count / MAX_PAGINATION_TILE), 1) : 1;
	const emptyKind: MyListEmptyKind = toEmptyKind(params);

	return (
		<main className={styles.main}>
			<section className={styles.heading}>
				<div>
					<h1>내 프로필</h1>
					<p>
						<strong>{totalCount}</strong> / {MAX_TEMPLATE_LIMIT}개 만들었어요.
					</p>
				</div>

				{/* 하나도 없을 때는 빈 화면의 "프로필 만들기"가 같은 일을 해서 이 버튼은 감춘다. */}
				{totalCount > 0 ? (
					<LinkButton href="/create" width="auto" className={styles.create}>
						<i className="bi bi-plus-lg" aria-hidden="true"></i>새 프로필
					</LinkButton>
				) : null}
			</section>

			{/* 뒤로 가기 등으로 주소가 바뀌면 툴바 입력값도 그 주소에 맞게 다시 그린다. */}
			{totalCount > 0 ? <MyListToolbar query={query} /> : null}

			{characters.success && characters.result.characters.length > 0 ? (
				<>
					<ul className={styles.grid} aria-label="내 프로필 목록">
						{characters.result.characters.map((character, index) => (
							<li key={character.uuid}>
								<MyCharacterTile character={character} priority={index < FIRST_ROW_COUNT} nonce={nonce} params={params} />
							</li>
						))}
					</ul>

					<MyListPagination query={query} lastPage={lastPage} />
				</>
			) : (
				<MyListEmpty kind={emptyKind} public_mode={check.data?.public_mode ?? "all"} />
			)}
		</main>
	);
}
