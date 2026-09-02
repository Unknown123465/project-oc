import styles from "./page.module.css";

export default function Create() {
	return (
		<main className={styles.main}>
			<section className={styles.heading}>
				<h1>새 캐릭터 등록</h1>

				<p className={styles.subtitle}>핵심 정보부터 작성하세요. 오른쪽 프로필은 입력하는 즉시 완성됩니다.</p>
			</section>

			<div className={styles.mobile_tabs} role="tablist" aria-label="작성 화면 전환">
				<button type="button" role="tab" aria-selected="true">
					작성
				</button>

				<button type="button" role="tab" aria-selected="false">
					미리보기
				</button>
			</div>

			<div className={styles.layout}>
				<form className={styles.form}>
					<input type="hidden" name="imageType" />
					<input type="hidden" name="imageFrame" />
					<input type="hidden" name="imageCrop" />

					<section className={styles.section} aria-labelledby="create-image-heading">
						<h2 id="create-image-heading">
							캐릭터 이미지 <span className={styles.required}>*</span>
						</h2>

						<button type="button" className={styles.upload_zone}>
							<img className={styles.upload_preview} alt="적용된 캐릭터 이미지" />

							<span className={styles.upload_prompt}>
								<strong>캐릭터 이미지 추가</strong>
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

					<section className={styles.section} aria-labelledby="create-core-heading">
						<h2 id="create-core-heading">핵심 정보</h2>

						<div className={styles.field}>
							<label htmlFor="create-name">
								이름 <span className={styles.required}>*</span>
							</label>

							<input className={styles.input} id="create-name" name="charName" maxLength={20} placeholder="캐릭터 이름을 입력하세요" />

							<p className={styles.field_help}>최대 20자</p>
						</div>

						<div className={styles.field}>
							<label htmlFor="create-message">
								한 줄 소개 <span className={styles.required}>*</span>
							</label>

							<input className={styles.input} id="create-message" name="charMessage" maxLength={30} placeholder="이 캐릭터를 한 문장으로 소개해 주세요" />

							<p className={styles.field_help}>최대 30자</p>
						</div>

						<div className={styles.field_row}>
							<div className={styles.field}>
								<label htmlFor="create-like">좋아하는 것</label>

								<textarea className={styles.textarea} id="create-like" name="charLike" rows={3} maxLength={100} placeholder="무대 위에 서는 것" />

								<p className={styles.field_help}>최대 100자 (공백 포함)</p>
							</div>

							<div className={styles.field}>
								<label htmlFor="create-hate">싫어하는 것</label>

								<textarea className={styles.textarea} id="create-hate" name="charHate" rows={3} maxLength={100} placeholder="포기하는 것" />

								<p className={styles.field_help}>최대 100자 (공백 포함)</p>
							</div>
						</div>

						<div className={styles.field}>
							<label htmlFor="create-personality">성격</label>

							<textarea
								className={styles.textarea}
								id="create-personality"
								name="charPersonality"
								rows={4}
								maxLength={100}
								placeholder="밝고 긍정적이며 꾸준히 노력하는 성격입니다."
							/>

							<p className={styles.field_help}>최대 100자 (공백 포함)</p>
						</div>

						<div className={styles.field}>
							<label htmlFor="create-tmi">TMI</label>

							<textarea className={styles.textarea} id="create-tmi" name="charTmi" placeholder="한 줄에 하나씩, 최대 10개까지 입력하세요" />

							<p className={styles.field_help}>줄바꿈으로 구분, 한 줄 최대 30자</p>
						</div>
					</section>

					<section className={styles.section} aria-labelledby="create-color-heading">
						<h2 id="create-color-heading">프로필 색상</h2>

						<div className={styles.field}>
							<label htmlFor="create-color">퍼스널 컬러</label>

							<input className={styles.color_input} id="create-color" name="charColor" type="color" defaultValue="#d3d3d3" />

							<p className={styles.field_help}>캐릭터의 강조선과 배경에 적용됩니다.</p>
						</div>

						<details className={styles.optional_fields}>
							<summary>선택 정보 추가</summary>

							<div className={styles.optional_fields_body}>
								<div className={styles.field_row}>
									<div className={styles.field}>
										<label htmlFor="create-kind">종족</label>

										<input className={styles.input} id="create-kind" name="charKind" maxLength={10} placeholder="예: 엘프" />
									</div>

									<div className={styles.field}>
										<label htmlFor="create-age">나이</label>

										<input className={styles.input} id="create-age" name="charAge" maxLength={20} placeholder="예: 19세" />
									</div>
								</div>

								<div className={styles.field_row}>
									<div className={styles.field}>
										<label htmlFor="create-birthday">생일</label>

										<input className={styles.input} id="create-birthday" name="charBirthday" maxLength={10} placeholder="예: 2월 7일" />
									</div>

									<div className={styles.field}>
										<label htmlFor="create-height">키</label>

										<input className={styles.input} id="create-height" name="charHeight" maxLength={10} placeholder="예: 162cm" />
									</div>
								</div>

								<div className={styles.field_row}>
									<div className={styles.field}>
										<label htmlFor="create-mbti">MBTI</label>

										<input className={styles.input} id="create-mbti" name="charMbti" maxLength={4} placeholder="예: ENFP" />
									</div>

									<div className={styles.field}>
										<label htmlFor="create-music">테마곡 링크</label>

										<input className={styles.input} id="create-music" name="charMusic" type="url" placeholder="YouTube 또는 음악 링크" />
									</div>
								</div>
							</div>
						</details>
					</section>

					<section className={styles.section} aria-labelledby="create-ai-heading">
						<h2 id="create-ai-heading">
							프로필 이미지에 AI를 사용했나요? <span className={styles.required}>*</span>
						</h2>

						<p className={styles.warning}>AI를 사용했지만 사용하지 않았다고 응답한 경우 프로필이 삭제될 수 있습니다.</p>

						<div className={styles.choice_list}>
							<label className={styles.choice_card}>
								<input type="radio" name="aiUsed" value="1" />

								<span>
									<strong>네, AI를 사용했습니다</strong>
								</span>
							</label>

							<label className={styles.choice_card}>
								<input type="radio" name="aiUsed" value="0" />

								<span>
									<strong>아니오, AI를 사용하지 않았습니다</strong>
								</span>
							</label>
						</div>
					</section>

					<section className={styles.section} aria-labelledby="create-visibility-heading">
						<h2 id="create-visibility-heading">공개 여부</h2>

						<div className={styles.choice_list}>
							<label className={styles.choice_card}>
								<input type="radio" name="publicMode" value="0" defaultChecked />

								<span>
									<strong>공개</strong>
									<small>검색과 링크를 통해 누구나 프로필을 볼 수 있습니다.</small>
								</span>
							</label>

							<label className={styles.choice_card}>
								<input type="radio" name="publicMode" value="1" />

								<span>
									<strong>일부 공개</strong>
									<small>링크를 가진 사람만 프로필을 볼 수 있습니다.</small>
								</span>
							</label>

							<label className={styles.choice_card}>
								<input type="radio" name="publicMode" value="2" />

								<span>
									<strong>비공개</strong>
									<small>본인만 프로필을 볼 수 있습니다.</small>
								</span>
							</label>
						</div>
					</section>

					<div className={styles.actions}>
						<button type="submit" className={styles.submit_button}>
							프로필 완성
						</button>

						<button type="button" className={styles.draft_button}>
							임시 저장
						</button>
					</div>
				</form>

				<aside className={styles.preview} aria-label="캐릭터 프로필 미리보기">
					<div className={styles.preview_label}>
						<span>실시간 미리보기</span>
						<span>가로형 프로필</span>
					</div>

					<article className={styles.preview_sheet}>
						<div className={styles.preview_hero}>
							<img className={styles.preview_image} alt="캐릭터 프로필 이미지" />

							<div className={styles.preview_body}>
								<div className={styles.preview_identity}>
									<h2>캐릭터 이름</h2>

									<p>이 캐릭터를 한 문장으로 소개해 주세요.</p>
								</div>

								<dl className={styles.preview_facts}>
									<div className={styles.fact}>
										<dt>종족</dt>
										<dd>미입력</dd>
									</div>

									<div className={styles.fact}>
										<dt>나이</dt>
										<dd>미입력</dd>
									</div>

									<div className={styles.fact}>
										<dt>생일</dt>
										<dd>미입력</dd>
									</div>

									<div className={styles.fact}>
										<dt>키</dt>
										<dd>미입력</dd>
									</div>

									<div className={styles.fact}>
										<dt>MBTI</dt>
										<dd>미입력</dd>
									</div>
								</dl>

								<div className={styles.preview_blocks}>
									<section className={styles.preview_block}>
										<h3>좋아하는 것</h3>
										<p>좋아하는 것을 입력해 주세요.</p>
									</section>

									<section className={styles.preview_block}>
										<h3>싫어하는 것</h3>
										<p>싫어하는 것을 입력해 주세요.</p>
									</section>

									<section className={styles.preview_block_wide}>
										<h3>성격</h3>
										<p>성격을 간단히 소개해 주세요.</p>
									</section>

									<section className={styles.preview_block_wide}>
										<h3>TMI</h3>
										<ul>
											<li>작은 습관이나 숨은 설정을 적어 주세요.</li>
										</ul>
									</section>
								</div>
							</div>
						</div>
					</article>
				</aside>
			</div>
		</main>
	);
}
