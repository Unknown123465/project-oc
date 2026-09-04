"use client";

import {useWatch, type Control, type UseFormSetValue} from "react-hook-form";
import styles from "./ColorPreset.module.css";
import {CreateCharFormInputType} from "@/app/create/validator";
import {PointerEvent, useState} from "react";

interface ColorPresetProps {
	control: Control<CreateCharFormInputType>;
	setValue: UseFormSetValue<CreateCharFormInputType>;
}

type Hex = `#${string}`;

type PresetList = {
	label: string;
	hex: Hex;
};

const PRESET_LIST: PresetList[] = [
	{
		label: "빨강",
		hex: "#ff0000",
	},
];

export default function ColorPreset({control, setValue}: ColorPresetProps) {
	const charColor = useWatch({
		name: "charColor",
		control,
	});

	const [isOpen, setIsOpen] = useState<boolean>(false);

	const currentPreset = PRESET_LIST.find((list) => list.hex === charColor);

	const presetClick = (value: Hex) => {
		console.log(value);

		setValue("charColor", value);
	};

	return (
		<div className={styles.box}>
			<button type="button" onClick={() => setIsOpen((prev) => !prev)}>
				<div className={styles.current_value}>
					{currentPreset ? <span className={styles.color_icon} style={{"--bg": currentPreset.hex}}></span> : null}

					<span className={styles.color_name}>{currentPreset?.label ?? "프리셋..."}</span>
				</div>

				<i className={`bi bi-caret-down-fill ${styles.arrow} ${isOpen ? styles.rotate : ""}`}></i>
			</button>

			{isOpen ? <hr /> : null}

			{isOpen ? (
				<ul className={styles.list}>
					{PRESET_LIST.map(({label, hex}) => (
						<li key={label} onClick={() => presetClick(hex)}>
							<span className={styles.color_icon} style={{"--bg": hex}}></span>
                            
							<span className={styles.color_name}>{label}</span>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}
