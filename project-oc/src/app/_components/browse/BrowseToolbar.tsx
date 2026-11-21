"use client";

import Form from "next/form";
import {useEffect, useRef, type ChangeEvent} from "react";
import styles from "./BrowseToolbar.module.css";
import {SubmitButton} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {MAX_KEYWORD_LENGTH} from "../mylist/validator";
import type {BrowseSort} from "./validator";

const SORT_OPTIONS: {value: BrowseSort; label: string}[] = [
	{value: "latest", label: "최신순"},
	{value: "like", label: "좋아요순"},
];

interface BrowseToolbarProps {
	keyword: string;
	sort: BrowseSort;
}

/* /mylist 툴바에서 공개 여부를 빼고 정렬을 둘로 줄인 모양이다. next/form이 GET 제출을 클라이언트 이동으로
   바꿔 /browse?page=1&keyword=&sort= 로 이동한다. 조건이 바뀌면 첫 페이지부터 다시 보므로 page는 1로
   고정해 보내고, 빠진 page 때문에 서버가 한 번 더 redirect하지 않게 한다. */
export default function BrowseToolbar({keyword, sort}: BrowseToolbarProps) {
	const keywordRef = useRef<HTMLInputElement>(null);
	const sortRef = useRef<HTMLSelectElement>(null);
	const waitRef = useRef<number>(-1);

	/* 뒤로 가기 등으로 주소가 바뀌면 입력값도 그 주소에 맞춘다. 입력 중인 검색창은 덮어쓰지 않는다. */
	useEffect(() => {
		const input = keywordRef.current;

		if (input !== null && document.activeElement !== input) {
			input.value = keyword;
		}

		if (sortRef.current !== null) {
			sortRef.current.value = sort;
		}
	}, [keyword, sort]);

	useEffect(() => {
		return () => {
			window.clearTimeout(waitRef.current);
		};
	}, []);

	const queryChange = (e: ChangeEvent<HTMLFormElement, HTMLInputElement | HTMLSelectElement>) => {
		const {currentTarget} = e;

		if (e.target.name === "sort") {
			currentTarget.requestSubmit();
		} else {
			window.clearTimeout(waitRef.current);

			waitRef.current = window.setTimeout(() => {
				currentTarget.requestSubmit();
			}, 250);
		}
	};

	return (
		<Form className={styles.toolbar} action="/browse" role="search" replace onChange={queryChange} onSubmit={() => window.clearTimeout(waitRef.current)}>
			<input type="hidden" name="page" value="1" />

			<div className={styles.search}>
				<label htmlFor="browse-search" className={styles.sr_only}>
					캐릭터 이름, 한 줄 소개 검색
				</label>

				<i className="bi bi-search" aria-hidden="true"></i>

				<input
					id="browse-search"
					ref={keywordRef}
					type="search"
					name="keyword"
					defaultValue={keyword}
					placeholder="이름 또는 한 줄 소개"
					autoComplete="off"
					maxLength={MAX_KEYWORD_LENGTH}
				/>

				<SubmitButton className={styles.submit} styleType="simple">
					검색
				</SubmitButton>
			</div>

			<Select name="sort" className={styles.sort} ref={sortRef} label="정렬" ariaLabelOnly defaultValue={sort} height={44}>
				{SORT_OPTIONS.map(({value, label}) => (
					<option key={value} value={value}>
						{label}
					</option>
				))}
			</Select>
		</Form>
	);
}
