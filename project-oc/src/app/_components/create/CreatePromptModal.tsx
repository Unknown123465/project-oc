"use client";

import {useEffect, useId, useRef, useState, type ChangeEvent, type MouseEvent, type SyntheticEvent} from "react";
import styles from "./CreatePromptModal.module.css";
import sectionStyles from "./Section.module.css";
import {ActionButton} from "@/components/ui/button";
import {useScrollLock} from "@/hooks/useScrollLock";
import {useBlockNavigation} from "@/hooks/useBlockNavigation";
import {IMAGE_ACCEPTED_TYPES, IMAGE_MAX_DIMENSION, IMAGE_MAX_FILE_SIZE, IMAGE_TYPE_DEFINITIONS, type ImageType} from "@/app/create/imageEditor";
import {useForm, UseFormSetValues} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {CreateCharFormInputType, createPromptForm, CreatePromptFormType, createPromptRequireForm} from "@/app/create/validator";
import {PromptApplyValue} from "./ImageUploadField";
import {Textarea} from "@/components/ui/textarea";

const AI_DRAFT_DESCRIPTION_MAX_LENGTH = 1000;

/* 결과 화면에 늘어놓을 프로필 항목(테마곡 제외). 순서는 /create 폼의 위→아래
   순서를 그대로 따른다 — 이미지 → 핵심 정보 → 퍼스널 컬러 → 선택 항목.
   wide는 2열 그리드에서 한 줄을 통째로 차지할지 — 100자짜리는 2열에 넣으면
   한 칸이 200px도 안 돼 읽기 어렵다(생성 폼도 같은 이유로 상하 배치).
   TODO: maxLength 리터럴은 validator.ts와 중복 — 상수로 분리되면 그쪽을 참조할 것. */

const CHAR_FIELD_KEY_LIST = [
	"charName",
	"charMessage",
	"charLike",
	"charHate",
	"charPersonality",
	"charTmi",
	"charKind",
	"charAge",
	"charBirthday",
	"charHeight",
	"charBirthplace",
	"charMbti",
] as const;
type CharFieldKey = (typeof CHAR_FIELD_KEY_LIST)[number];

interface DraftFieldDefinition {
	key: CharFieldKey;
	label: string;
	maxLength?: number;
	maxLines?: number;
	wide: boolean;
}

type CreateResultStringType = Record<CharFieldKey, string>;
type CreateResultBlobType = {charImage: Blob};

type CreateResultType = Partial<CreateResultStringType & CreateResultBlobType>;

/* CoreInfoSection 순서 */
const CORE_DRAFT_FIELDS: DraftFieldDefinition[] = [
	{key: "charName", label: "이름", maxLength: 20, wide: false},
	{key: "charMessage", label: "한 줄 소개", maxLength: 30, wide: true},
	{key: "charLike", label: "좋아하는 것", maxLength: 100, wide: true},
	{key: "charHate", label: "싫어하는 것", maxLength: 100, wide: true},
	{key: "charPersonality", label: "성격", maxLength: 100, wide: true},
	{key: "charTmi", label: "TMI", maxLines: 5, wide: true},
];

/* OptionalFieldsDetails 순서 */
const OPTIONAL_DRAFT_FIELDS: DraftFieldDefinition[] = [
	{key: "charKind", label: "종족", maxLength: 10, wide: false},
	{key: "charAge", label: "나이", maxLength: 20, wide: false},
	{key: "charBirthday", label: "생일", maxLength: 10, wide: false},
	{key: "charHeight", label: "키", maxLength: 10, wide: false},
	{key: "charBirthplace", label: "출생지", maxLength: 20, wide: false},
	{key: "charMbti", label: "MBTI", maxLength: 4, wide: false},
];

/* value가 null이면 제안 없음. reason이 "unverified"면 제안은 있었지만 설명에서
   근거를 못 찾아 버린 경우 — 사용자에게 두 상황을 다른 문구로 보여준다. */
interface DraftFieldResult {
	value: string | null;
	reason?: "unverified";
}

interface DraftResult {
	layout: {type: ImageType; reason: string; fx: number; fy: number} | null;
	color: string | null;
	fields: Record<CharFieldKey, DraftFieldResult>;
}

/* TODO: 레이아웃 확인용 임시 표본. 서버 액션 응답 타입이 정해지면 지우고 state로 교체할 것. */
const SAMPLE_RESULT: DraftResult = {
	layout: {
		type: "s",
		reason: "기".repeat(39) + "모",
		fx: 0.4,
		fy: 0.6,
	},
	color: "#7C5CFF",
	fields: {
		charName: {value: "세라핀"},
		charMessage: {value: "단 것 앞에서는 무너지는 은발의 검사."},
		charLike: {value: "단 것, 고양이"},
		charHate: {value: "비 오는 날"},
		charPersonality: {value: "말수가 적고 무뚝뚝하지만 정이 많다."},
		charTmi: {value: "고양이 이름은 콩이\n비 오는 날엔 집 밖으로 안 나간다"},
		charKind: {value: "반요"},
		charAge: {value: "열아홉"},
		charBirthday: {value: null},
		charHeight: {value: null},
		charBirthplace: {value: null, reason: "unverified"},
		charMbti: {value: null},
	},
};

const EMPTY_FIELD_MESSAGE: Record<NonNullable<DraftFieldResult["reason"]> | "missing", string> = {
	missing: "제안이 없어요.",
	unverified: "설명에서 근거를 찾지 못해 제외했어요.",
};

/* "#RRGGBB"(validator.ts의 charColor 형식)를 "R: 124 G: 92 B: 255"로. 서버에서
   재검증된 값만 오므로 형식 검사는 하지 않는다. */
function formatHexAsRgb(hex: string): string {
	const r: number = parseInt(hex.slice(1, 3), 16);
	const g: number = parseInt(hex.slice(3, 5), 16);
	const b: number = parseInt(hex.slice(5, 7), 16);

	return `R: ${r} G: ${g} B: ${b}`;
}

export interface CreatePromptModalProps {
	open: boolean;
	onClose: () => void;
	remainingToday: number;
	dailyLimit: number;
	/** 생성 폼에서 이미 고른 이미지 유형. 추천과 다르면 결과 화면에 대비를 보여주고,
	    반영 시 이미지를 다시 잘라야 한다는 확인 모달의 근거가 된다. */
	currentLayout: ImageType | "";
	setValuesByForm: UseFormSetValues<CreateCharFormInputType>;
	imagePromptResultApply: (data: PromptApplyValue) => void;
}

export default function CreatePromptModal({open, onClose, remainingToday, dailyLimit, currentLayout, setValuesByForm, imagePromptResultApply}: CreatePromptModalProps) {
	useScrollLock(open);

	const titleId = useId();
	const descriptionFieldId = useId();
	const noticeId = useId();
	const resultFieldIdBase = useId();

	const dialogRef = useRef<HTMLDialogElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const {
		register,
		handleSubmit,
		control,
		setValues,
		setError,
		formState: {errors},
	} = useForm({
		defaultValues: {},
		resolver: zodResolver(createPromptForm),
		mode: "onChange",
	});

	const [promptDescription, setPromptDescription] = useState<string>("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imageURL, setImageURL] = useState<string | null>(null);
	const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const [hasResult, setHasResult] = useState<boolean>(false);

	const [errorMessage, setErrorMessage] = useState<string>("");

	/* 결과는 하루 10회 중 1회를 쓴 산물이라 뒤로가기 한 번에 날아가면 안 된다. */
	useBlockNavigation(open && hasResult);

	useEffect(() => {
		const dialog: HTMLDialogElement | null = dialogRef.current;

		if (dialog === null) {
			return;
		}

		if (open && !dialog.open) {
			dialog.showModal();
		} else if (!open && dialog.open) {
			setErrorMessage("");

			dialog.close();
		}
	}, [open]);

	useEffect(() => {
		if (imageURL !== null) {
			return () => {
				URL.revokeObjectURL(imageURL);
			};
		}
	}, [imageURL]);

	const isOverLimit: boolean = promptDescription.length > AI_DRAFT_DESCRIPTION_MAX_LENGTH;

	const requestClose = () => {
		dialogRef.current?.close();
	};

	/* TODO: 결과가 떠 있을 때의 닫기. ConfirmModal("초안이 사라져요") → 예 →
	   setHasResult(false) 후 close. 지금은 뼈대라 바로 닫는다. */
	const requestCloseResult = () => {
		requestClose();
	};

	/* Esc는 dialog의 cancel 이벤트로 온다. 결과 화면에서는 막고 확인 모달로 돌린다.
	   단, Chrome은 사용자 조작 없이 연달아 누른 두 번째 Esc는 preventDefault를
	   무시하고 닫아 버린다(close watcher 규칙) — 그래서 뒤로가기와 마찬가지로
	   100% 방어는 아니고, 확인 모달이 1차 방어선이다. */
	const handleDialogCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
		if (!hasResult) {
			return;
		}

		e.preventDefault();
		requestCloseResult();
	};

	/* ::backdrop 클릭은 dialog 자신을 target으로 만든다. 실제 내용 영역 밖을 눌렀을 때만 닫는다.
	   결과 화면에서는 실수로 잃기 쉬우므로 백드롭 클릭을 무시한다. */
	const handleBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
		const dialog: HTMLDialogElement | null = dialogRef.current;

		if (dialog === null || e.target !== dialog || hasResult) {
			return;
		}

		const rect: DOMRect = dialog.getBoundingClientRect();
		const insideDialog: boolean = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

		if (!insideDialog) {
			dialog.close();
		}
	};

	const promptDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
		setPromptDescription(e.target.value);
	};

	const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const inputTag: HTMLInputElement = e.target;
		const file: File | undefined = inputTag.files?.[0];

		try {
			if (!file) {
				throw new Error("파일을 첨부해 주세요.");
			} else if (!IMAGE_ACCEPTED_TYPES.includes(file.type as (typeof IMAGE_ACCEPTED_TYPES)[number])) {
				throw new Error("PNG, JPG, WEBP 이미지만 사용할 수 있어요.");
			} else if (file.size > IMAGE_MAX_FILE_SIZE) {
				throw new Error("이미지 용량은 10MB 이하여야 해요.");
			}

			setErrorMessage("");
			setIsReadingFile(true);

			const objectUrl: string = URL.createObjectURL(file);
			const imgTag: HTMLImageElement = new Image();

			const {promise, resolve, reject} = Promise.withResolvers<void>();

			let waitTime: number = -1;

			imgTag.onload = () => {
				window.clearTimeout(waitTime);

				if (imgTag.naturalWidth > IMAGE_MAX_DIMENSION || imgTag.naturalHeight > IMAGE_MAX_DIMENSION) {
					URL.revokeObjectURL(objectUrl);

					reject(new Error(`이미지는 가로세로 ${IMAGE_MAX_DIMENSION}px 이하여야 해요.`));
				} else {
					resolve();
				}
			};

			imgTag.onerror = () => {
				window.clearTimeout(waitTime);

				URL.revokeObjectURL(objectUrl);

				reject(new Error("이미지를 읽을 수 없어요. 다른 파일을 선택해 주세요."));
			};

			waitTime = window.setTimeout(() => {
				URL.revokeObjectURL(objectUrl);

				reject(new Error("이미지 읽는 시간이 너무 오래 걸려요. 다시 시도 하거나 다른 파일을 선택해 주세요."));
			}, 1000 * 5);

			imgTag.src = objectUrl;

			await promise;

			setImageFile(file);
			setImageURL(objectUrl);
		} catch (err) {
			if (err instanceof Error) {
				setErrorMessage(err.message);
			}
		} finally {
			inputTag.value = "";

			setIsReadingFile(false);
		}
	};

	const handleCancel = () => {
		setImageFile(null);
		setErrorMessage("");

		if (fileInputRef.current !== null) {
			fileInputRef.current.value = "";
		}
	};

	/* 핵심·선택 항목 두 묶음 사이에 퍼스널 컬러 카드가 끼어들어야 해서(폼 순서)
	   map 콜백을 하나로 뽑아 둔다. */
	const renderDraftField = (field: DraftFieldDefinition) => {
		const result: DraftFieldResult = SAMPLE_RESULT.fields[field.key];
		const isEmpty: boolean = result.value === null;
		const checkId: string = `${resultFieldIdBase}-${field.key}-check`;
		const textId: string = `${resultFieldIdBase}-${field.key}-text`;

		return (
			<div key={field.key} className={`${styles.result_field} ${field.wide ? styles.result_field_wide : ""}`}>
				<div className={styles.result_head}>
					<input type="checkbox" id={checkId} className={styles.result_check} aria-label={`${field.label} 반영`} defaultChecked={!isEmpty} disabled={isEmpty} />

					<label htmlFor={textId} className={styles.result_label}>
						{field.label}
					</label>

					{!isEmpty ? (
						<>
							{/* TODO: 편집으로 값이 바뀌었을 때(dirty)만 보이게. 클릭 시 AI 제안값으로 되돌린다. */}
							<button type="button" className={styles.result_reset} aria-label={`${field.label}을 AI 제안으로 되돌리기`} onClick={() => {}}>
								<i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
							</button>

							{/* TODO: 현재 값 기준으로 계산. 초과 시 counter_over·invalid를 켠다. */}
							<span className={styles.counter}>
								{field.maxLines !== undefined ? `${result.value?.split("\n").length ?? 0} / ${field.maxLines}줄` : `${result.value?.length ?? 0} / ${field.maxLength}`}
							</span>
						</>
					) : null}
				</div>

				{!isEmpty ? (
					<Textarea
						id={textId}
						name={field.key}
						control={control}
						label={field.label}
						ariaLabelOnly
						rows={field.wide ? 3 : 1}
						maxLength={field.maxLength}
						padding="10px 13px"
						style={{fontSize: 14, minHeight: 0, maxHeight: 200}}
					/>
				) : (
					/* disabled textarea는 대비가 낮고 스크린리더가 건너뛴다 — 문구는 일반 텍스트로 */
					<p id={textId} className={styles.result_empty}>
						{EMPTY_FIELD_MESSAGE[result.reason ?? "missing"]}
					</p>
				)}
			</div>
		);
	};

	const requestSubmit = async () => {
		try {
			if (!promptDescription.trim() && imageFile === null) {
				throw new Error("캐릭터 설명 또는 참고 이미지를 첨부해 주세요.");
			} else if (isOverLimit) {
				throw new Error(`캐릭터 설명을 ${AI_DRAFT_DESCRIPTION_MAX_LENGTH}자 이하로 입력해 주세요.`);
			}

			setErrorMessage("");
			setIsSubmitting(true);

			//TODO: 캐릭터 설명 및 이미지 전송 로직 구현 예정

			await new Promise((res) => setTimeout(res, 1000));

			setHasResult(true);
		} catch (err) {
			if (err instanceof Error) {
				setErrorMessage(err.message);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const resultSubmit = (data: CreatePromptFormType) => {
		try {
			const check = createPromptRequireForm.safeParse(data);

			if (!check.success) {
				throw check.error.issues[0].message;
			}

			const resultData = check.data;
			const resultObject: CreateResultType = {};

			for (const key of CHAR_FIELD_KEY_LIST) {
				const value = resultData[key];

				if (value !== null) {
					resultObject[key] = value;
				}
			}

			if (imageFile !== null) {
				resultObject.charImage = imageFile;
			}

			setValuesByForm(resultObject);

			if (imageFile === null || SAMPLE_RESULT.layout === null) {
				onClose();
			} else {
				imagePromptResultApply({
					file: imageFile,
					layout: SAMPLE_RESULT.layout.type,
					fx: SAMPLE_RESULT.layout.fx,
					fy: SAMPLE_RESULT.layout.fy,
				});
			}
		} catch (err) {
			if (err instanceof Error) {
				setError("root", {
					message: err.message,
				});
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<dialog ref={dialogRef} className={styles.backdrop} aria-labelledby={titleId} onClose={onClose} onCancel={handleDialogCancel} onClick={handleBackdropClick}>
			{!hasResult ? (
				<>
					<div className={styles.head}>
						<div>
							<h2 id={titleId}>AI 프로필 초안</h2>

							<p>캐릭터를 자유롭게 적으면 항목별로 나눠 드려요. 반영할지는 직접 고르세요.</p>
						</div>

						<button type="button" className={styles.close} aria-label="AI 프로필 초안 닫기" onClick={requestClose}>
							<i className="bi bi-x-lg" aria-hidden="true"></i>
						</button>
					</div>

					<div className={styles.body}>
						<div className={styles.field}>
							<div className={styles.field_head}>
								<label htmlFor={descriptionFieldId}>캐릭터 설명</label>

								<span className={`${styles.counter} ${isOverLimit ? styles.counter_over : ""}`}>
									{promptDescription.length} / {AI_DRAFT_DESCRIPTION_MAX_LENGTH}
								</span>
							</div>

							<textarea
								id={descriptionFieldId}
								className={`${styles.textarea} ${isOverLimit ? styles.invalid : ""}`}
								value={promptDescription}
								onChange={promptDescriptionChange}
								placeholder={"은발에 붉은 눈, 열아홉 살. 말수가 적지만 단 것 앞에서는 무너진다.\n고양이를 키우고, 비 오는 날을 싫어한다..."}
								aria-describedby={noticeId}
								aria-invalid={isOverLimit}
								autoFocus
							/>
						</div>

						<div className={styles.field}>
							<div className={styles.field_head}>
								<input type="file" className={styles.hidden_input} ref={fileInputRef} accept={IMAGE_ACCEPTED_TYPES.join(",")} onChange={handleFileChange} />

								<label>
									참고 이미지 <span className={styles.optional}>(선택)</span>
								</label>
							</div>

							<p className={styles.help}>이미지 유형과 색 추천에만 쓰여요. 프로필 이미지는 따로 등록해요.</p>

							{imageFile === null || imageURL === null ? (
								<div className={styles.file_picker}>
									<ActionButton styleType="attention" onClick={() => fileInputRef.current?.click()}>
										{isReadingFile ? "이미지 읽는 중" : "이미지 첨부"}
									</ActionButton>

									<p>PNG, JPG, WEBP / 최대 10MB 및 3000x3000px 이하</p>
								</div>
							) : (
								<div className={styles.attached}>
									{/* eslint-disable-next-line @next/next/no-img-element -- 첨부 미리보기는 blob: objectURL이라 next/image 최적화 대상이 아님 */}
									<img src={imageURL} alt={imageFile.name} className={styles.thumbnail} />

									<div className={styles.attached_info}>
										<span className={styles.file_name}>{imageFile.name}</span>

										<div className={styles.attached_actions}>
											<ActionButton onClick={() => fileInputRef.current?.click()}>변경</ActionButton>

											<ActionButton onClick={handleCancel}>제거</ActionButton>
										</div>
									</div>
								</div>
							)}
						</div>

						<p id={noticeId} className={styles.notice}>
							<strong>입력한 설명과 이미지는 초안을 만드는 데만 쓰이며, AI 학습에 사용되지 않습니다.</strong>
						</p>

						{promptDescription.trim().length === 0 && imageFile === null ? (
							<p className={styles.hint}>캐릭터 설명 또는 참고 이미지를 첨부해 주세요.</p>
						) : (
							<p role="alert" className={styles.error}>
								{errorMessage}
							</p>
						)}
					</div>

					<div className={styles.actions}>
						<span className={styles.remaining}>
							오늘 {remainingToday}/{dailyLimit}회 남음 · 매일 자정 초기화
						</span>

						<div className={styles.action_group}>
							<ActionButton onClick={requestClose} disabled={isSubmitting}>
								취소
							</ActionButton>

							<ActionButton styleType="attention" disabled={isSubmitting} onClick={requestSubmit}>
								{isSubmitting ? "만드는 중" : "프로필 초안 생성"}
							</ActionButton>
						</div>
					</div>
				</>
			) : (
				<>
					<div className={styles.head}>
						<div>
							<h2 id={titleId}>AI 프로필 초안</h2>

							<p>내용을 고쳐 쓸 수 있어요. 체크한 항목만 프로필에 들어가요.</p>
						</div>

						<button type="button" className={styles.close} aria-label="AI 프로필 초안 닫기" onClick={requestCloseResult}>
							<i className="bi bi-x-lg" aria-hidden="true"></i>
						</button>
					</div>

					<div className={styles.body}>
						{/* /create 폼 순서 그대로: 이미지 유형 → 핵심 정보 → 퍼스널 컬러 → 선택 항목.
						    이미지 유형·퍼스널 컬러는 참고 이미지를 첨부했을 때만 온다. null이면 카드 자체를 그리지 않는다. */}
						<div className={styles.result_grid}>
							{SAMPLE_RESULT.layout !== null ? (
								<section className={`${styles.result_card} ${styles.result_field_wide}`} aria-label="이미지 유형 추천">
									<div className={styles.result_head}>
										<input type="checkbox" className={styles.result_check} aria-label="이미지 유형 추천 반영" defaultChecked />

										<span className={styles.result_label}>이미지 유형</span>
									</div>

									<div className={styles.layout_body}>
										<span className={`${styles.layout_shape} ${styles[`shape_${SAMPLE_RESULT.layout.type}`]}`} aria-hidden="true"></span>

										<div className={styles.layout_text}>
											<p className={styles.layout_title}>{IMAGE_TYPE_DEFINITIONS[SAMPLE_RESULT.layout.type].label}을 추천해요</p>

											<p className={styles.layout_reason}>{SAMPLE_RESULT.layout.reason}</p>

											{currentLayout !== "" && currentLayout !== SAMPLE_RESULT.layout.type ? (
												<p className={styles.layout_diff}>
													현재 {IMAGE_TYPE_DEFINITIONS[currentLayout].label} → {IMAGE_TYPE_DEFINITIONS[SAMPLE_RESULT.layout.type].label}. 반영하면 이미지를 다시 잘라요.
												</p>
											) : null}
										</div>
									</div>
								</section>
							) : null}

							{SAMPLE_RESULT.color !== null ? (
								<section className={`${styles.result_card} ${styles.result_field_wide}`} aria-label="퍼스널 컬러 추천">
									<div className={styles.result_head}>
										<input type="checkbox" className={styles.result_check} aria-label="퍼스널 컬러 추천 반영" defaultChecked />

										<span className={styles.result_label}>퍼스널 컬러</span>
									</div>

									<div className={styles.color_body}>
										{/* 색은 응답마다 달라 CSS 모듈에 못 박을 수 없다 — 인라인이 정당한 유일한 자리 */}
										<span className={styles.color_swatch} style={{backgroundColor: SAMPLE_RESULT.color}} aria-hidden="true"></span>

										<div className={styles.color_text}>
											<span className={styles.color_rgb}>{formatHexAsRgb(SAMPLE_RESULT.color)}</span>

											<span className={styles.color_code}>{SAMPLE_RESULT.color.toUpperCase()}</span>
										</div>
									</div>
								</section>
							) : null}

							{CORE_DRAFT_FIELDS.map(renderDraftField)}

							{OPTIONAL_DRAFT_FIELDS.map(renderDraftField)}
						</div>
					</div>

					<p className={sectionStyles.error_message}>{errors.root?.message}</p>

					<div className={styles.actions}>
						{/* TODO: 체크된 개수로 갱신. 0개면 반영 버튼 disabled */}
						<span className={styles.remaining}>9개 항목 선택됨</span>

						<div className={styles.action_group}>
							<ActionButton onClick={requestCloseResult}>취소</ActionButton>

							<ActionButton styleType="attention" onClick={handleSubmit(resultSubmit)}>
								반영
							</ActionButton>
						</div>
					</div>
				</>
			)}
		</dialog>
	);
}
