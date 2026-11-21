import Link from "next/link";
import styles from "../mylist/MyListPagination.module.css";
import type {BrowseSort} from "./validator";

interface BrowsePaginationProps {
	page: number;
	keyword: string;
	sort: BrowseSort;
	lastPage: number;
}

/* 검색어와 정렬은 그대로 두고 page만 바꾼 주소를 만든다. */
function genPageURL(keyword: string, sort: BrowseSort, page: number): string {
	const params: URLSearchParams = new URLSearchParams();

	if (keyword) {
		params.set("keyword", keyword);
	}

	params.set("sort", sort);

	params.set("page", page.toString());

	return `/browse?${params.toString()}`;
}

/* 모양과 10쪽 단위 묶음은 /mylist 페이지 이동(MyListPagination)과 같다. */
export default function BrowsePagination({page, keyword, sort, lastPage}: BrowsePaginationProps) {
	if (lastPage <= 1) {
		return null;
	}

	const start: number = (Math.ceil(page / 10) - 1) * 10 + 1;
	const last: number = Math.min(start + 10 - 1, lastPage);

	const pages: number[] = Array.from({length: last - start + 1}, (_, index) => start + index);

	return (
		<nav className={styles.pagination} aria-label="페이지">
			{page > 1 ? (
				<Link href={genPageURL(keyword, sort, page - 1)} className={styles.step} aria-label="이전 페이지">
					<i className="bi bi-chevron-left" aria-hidden="true"></i>
				</Link>
			) : (
				<span className={`${styles.step} ${styles.disabled}`} aria-hidden="true">
					<i className="bi bi-chevron-left"></i>
				</span>
			)}

			<ol>
				{pages.map((value) => (
					<li key={value}>
						{value === page ? (
							<span aria-current="page">{value}</span>
						) : (
							<Link href={genPageURL(keyword, sort, value)} aria-label={`${value}페이지`}>
								{value}
							</Link>
						)}
					</li>
				))}
			</ol>

			{page < lastPage ? (
				<Link href={genPageURL(keyword, sort, page + 1)} className={styles.step} aria-label="다음 페이지">
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
