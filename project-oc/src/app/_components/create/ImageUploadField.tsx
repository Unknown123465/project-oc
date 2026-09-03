"use client";

import sectionStyles from "./Section.module.css";
import styles from "./ImageUploadField.module.css";
import { useId } from "react";

export default function ImageUploadField() {
	const titleId = useId();

	return (
		<section className={sectionStyles.section} aria-labelledby={titleId}>
			<h2 id={titleId}>
				캐릭터 이미지 <span className={sectionStyles.required}>*</span>
			</h2>

			<button type="button" className={styles.upload_zone}>
				<img className={styles.upload_preview} alt="적용된 캐릭터 이미지" />

				<span className={styles.upload_prompt}>
					<b>캐릭터 이미지 추가</b>

					<span>유형과 영역을 선택해 적용합니다.</span>
				</span>
			</button>

			<div className={styles.upload_meta}>
				<span>가로형</span>
				
				<span>사각형 프레임</span>

				<button type="button" className={styles.text_link}>
					다시 편집
				</button>
			</div>
		</section>
	);
}
