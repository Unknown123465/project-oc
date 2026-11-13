"use client";

import Form from "next/form";
import {useEffect, useRef, type ChangeEvent} from "react";
import styles from "./MyListToolbar.module.css";
import {SubmitButton} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {MAX_KEYWORD_LENGTH, type MyListQueryFormType, type MyListSort, type MyListPublicMode} from "./validator";

const SORT_OPTIONS: {value: MyListSort; label: string}[] = [
	{value: "latest", label: "최신순"},
	{value: "oldest", label: "오래된순"},
	{value: "name", label: "이름순"},
	{value: "like", label: "좋아요순"},
];

const PUBLIC_MODE_OPTIONS: {value: MyListPublicMode; label: string}[] = [
	{value: "all", label: "전체"},
	{value: "public", label: "공개"},
	{value: "link", label: "일부 공개"},
	{value: "private", label: "비공개"},
];

interface InputRef {
	keyword: HTMLInputElement | null;
	public_mode: (HTMLInputElement | null)[];
	sort: HTMLSelectElement | null;
}

interface MyListToolbarProps {
	query: MyListQueryFormType;
}

/* next/form은 GET 제출을 클라이언트 이동으로 바꿔 준다. 문서 전체를 다시 받지 않고
   /mylist?page=1&keyword=&public_mode=&sort= 로 이동한다. 검색 조건이 바뀌면 첫 페이지부터
   다시 보므로 page는 1로 고정해 보내고, 빠진 page 때문에 서버가 한 번 더 redirect하지 않게 한다. */
export default function MyListToolbar({query}: MyListToolbarProps) {
	const inputRef = useRef<InputRef>({
		keyword: null,
		public_mode: [],
		sort: null,
	});
	const waitRef = useRef<number>(-1);

	useEffect(() => {
		const {keyword, sort, public_mode} = inputRef.current;

		if (keyword !== null && document.activeElement !== keyword) {
			keyword.value = query.keyword ?? "";
		}

		if (sort !== null) {
			sort.value = query.sort;
		}

		for (const tag of public_mode) {
			if (tag !== null) {
				tag.checked = tag.value === query.public_mode;
			}
		}
	}, [query.keyword, query.sort, query.public_mode]);

	useEffect(() => {
		return () => {
			window.clearTimeout(waitRef.current);
		};
	}, []);

	const queryChange = (e: ChangeEvent<HTMLFormElement, HTMLInputElement | HTMLSelectElement>) => {
		const {currentTarget} = e;
		const {name} = e.target;

		if (name === "sort" || name === "public_mode") {
			currentTarget.requestSubmit();
		} else {
			window.clearTimeout(waitRef.current);

			waitRef.current = window.setTimeout(() => {
				currentTarget.requestSubmit();
			}, 250);
		}
	};

	return (
		<Form className={styles.toolbar} action="/mylist" role="search" replace onChange={queryChange} onSubmit={() => window.clearTimeout(waitRef.current)}>
			<input type="hidden" name="page" value="1" />

			<div className={styles.search}>
				<label htmlFor="mylist-search" className={styles.sr_only}>
					캐릭터 이름, 한 줄 소개 검색
				</label>

				<i className="bi bi-search" aria-hidden="true"></i>

				<input
					id="mylist-search"
					type="search"
					name="keyword"
					ref={(ref) => void (inputRef.current.keyword = ref)}
					defaultValue={query.keyword ?? undefined}
					placeholder="이름 또는 한 줄 소개"
					autoComplete="off"
					maxLength={MAX_KEYWORD_LENGTH}
				/>

				<SubmitButton className={styles.submit} styleType="simple">
					검색
				</SubmitButton>
			</div>

			<fieldset className={styles.visibility}>
				<legend className={styles.sr_only}>공개 여부</legend>

				{PUBLIC_MODE_OPTIONS.map(({value, label}, index) => (
					<label key={value}>
						<input type="radio" name="public_mode" ref={(ref) => void (inputRef.current.public_mode[index] = ref)} defaultChecked={query.public_mode === value} value={value} />

						<span>{label}</span>
					</label>
				))}
			</fieldset>

			<Select name="sort" className={styles.sort} ref={(ref) => void (inputRef.current.sort = ref)} label="정렬" ariaLabelOnly defaultValue={query.sort} height={44}>
				{SORT_OPTIONS.map(({value, label}) => (
					<option key={value} value={value}>
						{label}
					</option>
				))}
			</Select>
		</Form>
	);
}
