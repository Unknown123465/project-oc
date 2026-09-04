"use client";

import styles from "./ColorPreset.module.css";
import {useEffect, useId, useRef, useState, type KeyboardEvent} from "react";
import {useScrollLock} from "@/hooks/useScrollLock";
import {useMediaQuery} from "@/hooks/useMediaQuery";

type Hex = `#${string}`;

type PresetList = {
	label: string;
	hex: Hex;
};

/* 폼과는 값 하나만 주고받는다. react-hook-form을 직접 알지 않아야
   ColorSection 바깥에서도, 테스트에서도 그대로 쓸 수 있다. */
interface ColorPresetProps {
	value: string;
	onChange: (hex: Hex) => void;
}

const PRESET_LIST: PresetList[] = [
	{
		label: "선명한 빨강",
		hex: "#dc2626",
	},
	{
		label: "밝은 주황",
		hex: "#f97316",
	},
	{
		label: "밝은 노랑",
		hex: "#facc15",
	},
	{
		label: "밝은 민트",
		hex: "#2dd4bf",
	},
	{
		label: "짙은 초록",
		hex: "#16a34a",
	},
	{
		label: "하늘색",
		hex: "#38bdf8",
	},
	{
		label: "어두운 남색",
		hex: "#1e293b",
	},
	{
		label: "밝은 보라",
		hex: "#a855f7",
	},
	{
		label: "연한 분홍",
		hex: "#fb7185",
	},
	{
		label: "빨강",
		hex: "#ff0000",
	},
	{
		label: "주황",
		hex: "#ff7f00",
	},
	{
		label: "노랑",
		hex: "#ffff00",
	},
	{
		label: "연두",
		hex: "#7fff00",
	},
	{
		label: "초록",
		hex: "#00ff00",
	},
	{
		label: "하늘",
		hex: "#00ffff",
	},
	{
		label: "파랑",
		hex: "#0000ff",
	},
	{
		label: "보라",
		hex: "#8b00ff",
	},
	{
		label: "분홍",
		hex: "#ff007f",
	},
	{
		label: "하양",
		hex: "#ffffff",
	},
	{
		label: "밝은회색",
		hex: "#d1d5db",
	},
	{
		label: "회색",
		hex: "#6b7280",
	},
	{
		label: "검정",
		hex: "#000000",
	},
];

const LAST_INDEX = PRESET_LIST.length - 1;

/* ColorPreset.module.css가 목록을 전체 화면 모달로 바꾸는 분기점과 같은 값이어야 한다.
   여기서 어긋나면 모달이 아닌 그냥 펼침 목록인데도 배경 스크롤을 잠그게 된다. */
const MODAL_QUERY = "(width < 768px)";

export default function ColorPreset({value, onChange}: ColorPresetProps) {
	const listId = useId();

	const [isOpen, setIsOpen] = useState<boolean>(false);

	/* 키보드로 훑고 있는 위치. 실제 선택(value)과는 별개다. */
	const [activeIndex, setActiveIndex] = useState<number>(0);

	const boxRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLUListElement>(null);

	const selectedIndex: number = PRESET_LIST.findIndex((preset) => preset.hex.toLowerCase() === value.toLowerCase());
	const currentPreset: PresetList | null = selectedIndex === -1 ? null : PRESET_LIST[selectedIndex];

	const isModal: boolean = useMediaQuery(MODAL_QUERY);

	useScrollLock(isModal && isOpen);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const abort: AbortController = new AbortController();

		/* 여닫는 버튼도 이 상자 안에 있다. 목록만 기준으로 삼으면 버튼을 누를 때
		   pointerdown이 먼저 닫고 뒤이은 click이 도로 열어서 영영 닫히지 않는다. */
		document.addEventListener(
			"pointerdown",
			(e) => {
				if (!boxRef.current?.contains(e.target as Node)) {
					setIsOpen(false);
				}
			},
			{signal: abort.signal},
		);

		return () => {
			abort.abort();
		};
	}, [isOpen]);

	/* 훑고 있는 항목을 목록 안에서만 스크롤해 보여 준다. scrollIntoView는 목록이
	   화면 밖에 있으면 페이지까지 함께 움직이는데, 모바일에서는 useScrollLock이
	   body를 이미 고정해 둔 뒤라 그 스크롤이 배경을 통째로 맨 위로 끌어올린다. */
	useEffect(() => {
		const list: HTMLUListElement | null = listRef.current;

		if (!isOpen || list === null) {
			return;
		}

		const option: Element | undefined = list.children[activeIndex];

		if (option instanceof HTMLElement) {
			list.scrollTop = option.offsetTop - (list.clientHeight - option.clientHeight) / 2;
		}
	}, [isOpen, activeIndex]);

	const optionId = (index: number): string => `${listId}-option-${index}`;

	const open = () => {
		/* 열 때는 지금 고른 색에서부터 훑기 시작한다. */
		setActiveIndex(selectedIndex === -1 ? 0 : selectedIndex);
		setIsOpen(true);
	};

	const selectPreset = (index: number) => {
		onChange(PRESET_LIST[index].hex);
		setActiveIndex(index);
		setIsOpen(false);
	};

	const keyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
		if (e.key === "Escape") {
			setIsOpen(false);

			return;
		}

		if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
			/* 목록을 훑는 동안 페이지가 같이 스크롤되면 안 된다. */
			e.preventDefault();

			if (!isOpen) {
				open();

				return;
			}

			if (e.key === "Home") {
				setActiveIndex(0);
			} else if (e.key === "End") {
				setActiveIndex(LAST_INDEX);
			} else if (e.key === "ArrowDown") {
				setActiveIndex((prev) => Math.min(prev + 1, LAST_INDEX));
			} else {
				setActiveIndex((prev) => Math.max(prev - 1, 0));
			}

			return;
		}

		/* 열려 있을 때의 Enter·Space는 버튼을 다시 닫는 대신 훑던 항목을 고른다. */
		if (isOpen && (e.key === "Enter" || e.key === " ")) {
			e.preventDefault();

			selectPreset(activeIndex);
		}
	};

	return (
		<div className={`custom-select ${styles.box}`} ref={boxRef}>
			{/* 값을 고르기만 하는 select 대체물이라 ARIA의 select-only combobox 형태를 따른다.
			    button의 기본 role로는 aria-activedescendant가 무시된다. */}
			<button
				type="button"
				role="combobox"
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				aria-controls={isOpen ? listId : undefined}
				aria-activedescendant={isOpen ? optionId(activeIndex) : undefined}
				aria-label="퍼스널 컬러 프리셋"
				onClick={() => (isOpen ? setIsOpen(false) : open())}
				onKeyDown={keyDown}>
				<div className={styles.current_value}>
					{currentPreset !== null ? <span className={styles.color_icon} style={{"--bg": currentPreset.hex}}></span> : null}

					<span className={styles.color_name}>{currentPreset?.label ?? "프리셋..."}</span>
				</div>

				<i className={`bi bi-caret-down-fill ${styles.arrow} ${isOpen ? styles.rotate : ""}`}></i>
			</button>

			{isOpen ? <hr /> : null}

			{isOpen ? (
				<ul className={styles.list} ref={listRef} id={listId} role="listbox" aria-label="퍼스널 컬러 프리셋">
					{PRESET_LIST.map(({label, hex}, index) => (
						<li
							key={hex}
							id={optionId(index)}
							role="option"
							aria-selected={index === selectedIndex}
							className={`${index === selectedIndex ? styles.selected : ""} ${index === activeIndex ? styles.active : ""}`}
							style={{"--bg": hex}}
							onClick={() => selectPreset(index)}>
							<span className={styles.color_icon}></span>

							<span className={styles.color_name}>{label}</span>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}
