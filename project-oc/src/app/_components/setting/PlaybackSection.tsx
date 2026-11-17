"use client";

import {useState} from "react";
import styles from "./SettingSection.module.css";
import {ActionButton} from "@/components/ui/button";
import {setAutoplayMusic} from "@/app/setting/setAccountInfo";

interface PlaybackSectionProps {
	autoplayMusic: boolean;
}

export default function PlaybackSection({autoplayMusic}: PlaybackSectionProps) {
	const [autoplayMusicValue, setAutoplayMusicValue] = useState<boolean>(autoplayMusic);

	const [isSending, setIsSending] = useState<boolean>(false);

	const [errorMessage, setErrorMessage] = useState<string>("");

	const autoplayMusicChange = async () => {
		try {
			setIsSending(true);
			setErrorMessage("");

			const result = await setAutoplayMusic(!autoplayMusicValue);

			if (result.success) {
				setAutoplayMusicValue(result.result);
			} else {
				setErrorMessage(result.message);
			}
		} catch {
			setErrorMessage("저장하는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
		} finally {
			setIsSending(false);
		}
	};

	let buttonValue: string = "";

	if (isSending) {
		buttonValue = "변경중";
	} else {
		buttonValue = autoplayMusicValue ? "활성화" : "비활성화";
	}

	return (
		<section id="playback" className={styles.section} aria-labelledby="setting-playback-title">
			<h2 id="setting-playback-title">재생 설정</h2>

			<dl className={styles.rows}>
				<div className={styles.row}>
					<dt>테마곡 자동 재생</dt>
					<dd className={styles.value}>
						<span className={styles.text}>프로필을 열면 테마곡을 바로 재생해요.</span>
					</dd>
					<dd className={styles.action}>
						<ActionButton
							styleType={autoplayMusicValue ? "attention" : "normal"}
							ariaPressed={autoplayMusicValue}
							onClick={autoplayMusicChange}
							disabled={isSending}
							className={styles.toggle}
						>
							{buttonValue}
						</ActionButton>
					</dd>
				</div>
			</dl>

			<p className={styles.error_message} aria-live="polite">
				{errorMessage}
			</p>

			<ul className={styles.notes}>
				<li>브라우저가 소리 나는 자동 재생을 막으면 켜 두어도 재생되지 않을 수 있어요.</li>
				<li>스포티파이는 자동 재생을 지원하지 않아요.</li>
			</ul>
		</section>
	);
}
