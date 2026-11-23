import styles from "./page.module.css";
import type {Metadata} from "next";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {auth} from "@/auth/auth";
import {LinkButton} from "@/components/ui/button";
import BrowseToolbar from "@/app/_components/browse/BrowseToolbar";
import BrowseTile from "@/app/_components/browse/BrowseTile";
import BrowsePagination from "@/app/_components/browse/BrowsePagination";
import BrowseEmpty from "@/app/_components/browse/BrowseEmpty";
import {getBrowseCharacters, MAX_PAGINATION_TILE} from "@/app/template/[uuid]/getCharacter";

/* 한 줄 열 수(4, 3, 2)로 모두 나누어떨어지게 12개씩 보여 준다. */
const FIRST_ROW_COUNT = 4 as const;

export const metadata: Metadata = {
	title: "프로필 둘러보기 - 프로젝트 OC",
	description: "프로젝트 OC에 공개된 자작 캐릭터 프로필을 둘러보세요.",
};

export default async function BrowsePage({searchParams}: PageProps<"/browse">) {
	const params = await searchParams;

	const characters = await getBrowseCharacters(params);

	if (!characters.success) {
		redirect("/browse" + characters.redirectQuery, "replace");
	}

	const {characters: list, count, page, keyword, sort} = characters.result;

	const authInfo = await auth();
	const isLoggedIn: boolean = authInfo !== null && Boolean(authInfo.user?.id);

	const nonce: string | null = (await headers()).get("x-nonce");

	const lastPage: number = Math.max(Math.ceil(count / MAX_PAGINATION_TILE), 1);

	/* 공개 프로필이 하나도 없을 때는 빈 화면이 같은 버튼을 보여 주므로 제목 줄 버튼과 검색창을 감춘다. */
	const isNoProfile: boolean = count === 0 && !keyword;

	const subTitle: string = isLoggedIn
		? "다른 사람이 만든 캐릭터를 구경하고, 마음에 드는 프로필에 감상을 남겨 보세요."
		: "로그인하지 않아도 캐릭터를 구경할 수 있어요. 좋아요와 코멘트는 로그인한 뒤에 남길 수 있어요.";

	return (
		<main className={styles.main}>
			<section className={styles.heading}>
				<div>
					<h1>프로필 둘러보기</h1>
					<p>{subTitle}</p>
				</div>

				{isNoProfile ? null : (
					<LinkButton href={isLoggedIn ? "/create" : "/login?link=create"} width="auto" className={styles.create}>
						<i className={`bi ${isLoggedIn ? "bi-plus-lg" : "bi-box-arrow-in-right"}`} aria-hidden="true"></i>
						{isLoggedIn ? "프로필 만들기" : "로그인하고 만들기"}
					</LinkButton>
				)}
			</section>

			{isNoProfile ? null : <BrowseToolbar keyword={keyword} sort={sort} />}

			{list.length > 0 ? (
				<>
					<ul className={styles.grid} aria-label="공개 프로필 목록">
						{list.map((character, index) => (
							<li key={character.uuid}>
								<BrowseTile character={character} priority={index < FIRST_ROW_COUNT} nonce={nonce} page={page} keyword={keyword} sort={sort} />
							</li>
						))}
					</ul>

					<BrowsePagination page={page} keyword={keyword} sort={sort} lastPage={lastPage} />
				</>
			) : (
				<BrowseEmpty kind={keyword ? "search" : "none"} isLoggedIn={isLoggedIn} />
			)}
		</main>
	);
}
