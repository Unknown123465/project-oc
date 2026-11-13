import Link from "next/link";
import styles from "./MyListPagination.module.css";
import type {MyListQueryFormType} from "./validator";

interface MyListPaginationProps {
	query: MyListQueryFormType;
	lastPage: number;
}

/* 검색어, 공개 여부, 정렬은 그대로 두고 page만 바꾼 주소를 만든다. */
function genPageURL(query: MyListQueryFormType, page: number): string {
	const params: URLSearchParams = new URLSearchParams();

	if (query.keyword) {
		params.set("keyword", query.keyword);
	}

	params.set("public_mode", query.public_mode);
	params.set("sort", query.sort);
	params.set("page", page.toString());

	return `/mylist?${params.toString()}`;
}

export default function MyListPagination({query, lastPage}: MyListPaginationProps) {
	if (lastPage <= 1) {
		return null;
	}

	const start: number = (Math.ceil(query.page / 10) - 1) * 10 + 1;
	const last: number = Math.min(start + 10 - 1, lastPage);

	const current: number = query.page;
	const pages: number[] = Array.from({length: Math.min(10, last - start + 1)}, (_, index) => start + index);

	return (
		<nav className={styles.pagination} aria-label="페이지">
			{current > 1 ? (
				<Link href={genPageURL(query, current - 1)} className={styles.step} aria-label="이전 페이지">
					<i className="bi bi-chevron-left" aria-hidden="true"></i>
				</Link>
			) : (
				<span className={`${styles.step} ${styles.disabled}`} aria-hidden="true">
					<i className="bi bi-chevron-left"></i>
				</span>
			)}

			<ol>
				{pages.map((page) => (
					<li key={page}>
						{page === current ? (
							<span aria-current="page">{page}</span>
						) : (
							<Link href={genPageURL(query, page)} aria-label={`${page}페이지`}>
								{page}
							</Link>
						)}
					</li>
				))}
			</ol>

			{current < lastPage ? (
				<Link href={genPageURL(query, current + 1)} className={styles.step} aria-label="다음 페이지">
					<i className="bi bi-chevron-right" aria-hidden="true"></i>
				</Link>
			) : (
				<span className={`${styles.step} ${styles.disabled}`} aria-hidden="true">
					<i className="bi bi-chevron-right"></i>
				</span>
			)}
		</nav>
	);
}
