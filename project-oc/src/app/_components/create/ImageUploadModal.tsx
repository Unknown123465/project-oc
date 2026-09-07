"use client";

import {useEffect, useLayoutEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent, type PointerEvent} from "react";
import styles from "./ImageUploadModal.module.css";
import {ActionButton} from "@/components/ui/button";
import {IMAGE_ACCEPTED_TYPES, IMAGE_MAX_DIMENSION, IMAGE_MAX_FILE_SIZE, IMAGE_TYPES, IMAGE_TYPE_DEFINITIONS, IMAGE_UPLOAD_TYPE, ImageTypeDefinition, type ImageFrame, type ImageType} from "@/app/create/imageEditor";
import imageCompression, {type Options} from "browser-image-compression";

interface ImageUploadModalProps {
	open: boolean;
	onClose: () => void;
	onApply: (result: {image: Blob; imageType: ImageType; imageFrame: ImageFrame}) => void;
}

interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface Size {
	width: number;
	height: number;
}

type Handle = "nw" | "ne" | "sw" | "se";

interface DragState {
	handle: Handle | "move";
	startX: number;
	startY: number;
	crop: Rect;
}

/* 목업(목업/gpt/assets/app.js)의 initialCrop과 같은 규칙: 유형 비율에 맞춰
   화면에 보이는 이미지의 82% 안쪽에 크롭 영역을 가운데 정렬해 둔다. */
function initialCrop(width: number, height: number, ratio: number): Rect {
	let cropWidth: number = width * 0.82;
	let cropHeight: number = cropWidth / ratio;

	if (cropHeight > height * 0.82) {
		cropHeight = height * 0.82;
		cropWidth = cropHeight * ratio;
	}

	return {
		x: (width - cropWidth) / 2,
		y: (height - cropHeight) / 2,
		width: cropWidth,
		height: cropHeight,
	};
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(Math.max(value, minimum), maximum);
}

/* 잡은 모서리의 반대쪽 모서리를 고정점 삼아 크기를 바꾼다. 비율은 유형이 정한 값으로 고정된다. */
function resizeCrop(base: Rect, handle: Handle, point: {x: number; y: number}, displaySize: Size, ratio: number): Rect {
	const right: boolean = handle.endsWith("e");
	const bottom: boolean = handle.startsWith("s");
	const anchorX: number = right ? base.x : base.x + base.width;
	const anchorY: number = bottom ? base.y : base.y + base.height;
	const maxWidthByX: number = right ? displaySize.width - anchorX : anchorX;
	const maxHeightByY: number = bottom ? displaySize.height - anchorY : anchorY;
	const maxWidth: number = Math.max(1, Math.min(maxWidthByX, maxHeightByY * ratio));
	const minimumWidth: number = Math.min(72, maxWidth);
	const desiredWidth: number = Math.max(Math.abs(point.x - anchorX), Math.abs(point.y - anchorY) * ratio);
	const width: number = clamp(desiredWidth, minimumWidth, maxWidth);
	const height: number = width / ratio;

	return {
		x: right ? anchorX : anchorX - width,
		y: bottom ? anchorY : anchorY - height,
		width,
		height,
	};
}

async function toBlob(canvas: HTMLCanvasElement, fileName: string, signal: AbortSignal): Promise<Blob> {
	const originBlob: Blob | null = await new Promise((res) => canvas.toBlob(res, IMAGE_UPLOAD_TYPE, 1));

	if (originBlob === null) {
		throw new Error("이미지를 만드는데 실패했어요. 다시 시도해 주세요.");
	}

	const originFile: File = new File([originBlob], fileName, {
		type: IMAGE_UPLOAD_TYPE,
	});

	const options: Options = {
		useWebWorker: true,
		maxSizeMB: 10,
		maxWidthOrHeight: 3000,
		initialQuality: 1,
		signal,
	};

	/* signal이 끊겨서 난 실패라면 취소일 뿐 오류가 아니므로 원래 예외를 그대로
	   올려 보낸다. 그 외에는 라이브러리, 브라우저가 던지는 원문 메시지 대신
	   사용자에게 보여줄 한국어 메시지로 바꾼다. */
	try {
		return await imageCompression(originFile, options);
	} catch (err) {
		if (signal.aborted) {
			throw err;
		}

		throw new Error("이미지를 압축하는데 실패했어요. 다시 시도해 주세요.");
	}
}

/* 소수 첫째 자리까지만 반올림하고, 정수면(정사각형의 1처럼) 그대로 보여
   한눈에 비교되면서도 자릿수가 늘어져 혼란스럽지 않게 한다. */
function formatRatio(ratio: number, imageType: ImageType): string {
	const heightPerWidth: number = Math.round((1 / ratio) * 10) / 10;

	return imageType !== "v" ? `1 : ${heightPerWidth}` : `${heightPerWidth} : 1`;
}

export default function ImageUploadModal({open, onClose, onApply}: ImageUploadModalProps) {
	const titleId = useId();
	const cropHeadingId = useId();
	const controlsHeadingId = useId();

	const dialogRef = useRef<HTMLDialogElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);
	const canvasWrapRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const dragStateRef = useRef<DragState | null>(null);

	const abort = useRef<AbortController>(new AbortController());

	const [imageType, setImageType] = useState<ImageType>("h");
	const [frame, setFrame] = useState<ImageFrame>("square");
	const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
	const [fileName, setFileName] = useState<string>("");
	const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
	const [isApplying, setIsApplying] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [displaySize, setDisplaySize] = useState<Size>({width: 0, height: 0});
	const [crop, setCrop] = useState<Rect>({x: 0, y: 0, width: 0, height: 0});

	const definition: ImageTypeDefinition = IMAGE_TYPE_DEFINITIONS[imageType];

	/* displaySize는 화면에 맞춰 축소해 그린 크기라, 실제 고른 영역의 픽셀 수를
	   보여주려면 원본 배율(scale)만큼 되돌려야 한다. */
	const cropPixelSize: Size =
		sourceImage === null
			? {width: 0, height: 0}
			: {
					width: Math.round(crop.width * (sourceImage.naturalWidth / displaySize.width)),
					height: Math.round(crop.height * (sourceImage.naturalHeight / displaySize.height)),
				};

	const shade = {
		top: {left: 0, top: 0, width: displaySize.width, height: Math.max(0, crop.y)},
		bottom: {left: 0, top: crop.y + crop.height, width: displaySize.width, height: Math.max(0, displaySize.height - crop.y - crop.height)},
		left: {left: 0, top: crop.y, width: Math.max(0, crop.x), height: crop.height},
		right: {left: crop.x + crop.width, top: crop.y, width: Math.max(0, displaySize.width - crop.x - crop.width), height: crop.height},
	};

	useEffect(() => {
		const dialog: HTMLDialogElement | null = dialogRef.current;

		if (dialog === null) {
			return;
		}

		if (open && !dialog.open) {
			abort.current = abort.current.signal.aborted ? new AbortController() : abort.current;

			dialog.showModal();
		} else if (!open && dialog.open) {
			abort.current.abort();

			dialog.close();
		}
	}, [open]);

	/* 새 이미지를 불러왔거나 유형을 바꿨을 때만 다시 계산한다. 드래그 중 crop을
	   바꾸는 것과는 다른 경로라 여기 의존성에 crop을 넣지 않는다. */
	useLayoutEffect(() => {
		if (sourceImage === null) {
			return;
		}

		const stage: HTMLDivElement | null = stageRef.current;
		const availableWidth: number = clamp((stage?.clientWidth ?? 594) - 36, 240, 660);
		const availableHeight: number = clamp(window.innerHeight * 0.52, 260, 480);
		const scale: number = Math.min(availableWidth / sourceImage.naturalWidth, availableHeight / sourceImage.naturalHeight, 1.5);
		const width: number = Math.max(1, Math.round(sourceImage.naturalWidth * scale));
		const height: number = Math.max(1, Math.round(sourceImage.naturalHeight * scale));

		setDisplaySize({width, height});
		setCrop(initialCrop(width, height, IMAGE_TYPE_DEFINITIONS[imageType].ratio));
	}, [sourceImage, imageType]);

	/* 이미지를 캔버스에 한 번 그려 두고, 크롭 영역만 그 위에서 움직인다. */
	useEffect(() => {
		if (sourceImage === null) {
			return;
		}

		const canvas: HTMLCanvasElement | null = canvasRef.current;

		if (canvas === null) {
			return;
		}

		const pixelRatio: number = Math.min(window.devicePixelRatio || 1, 2);

		canvas.width = Math.round(displaySize.width * pixelRatio);
		canvas.height = Math.round(displaySize.height * pixelRatio);
		canvas.style.width = `${displaySize.width}px`;
		canvas.style.height = `${displaySize.height}px`;

		const context: CanvasRenderingContext2D | null = canvas.getContext("2d");

		if (context === null) {
			return;
		}

		context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
		context.clearRect(0, 0, displaySize.width, displaySize.height);
		context.drawImage(sourceImage, 0, 0, displaySize.width, displaySize.height);
	}, [sourceImage, displaySize]);

	/* 취소·X·배경 클릭은 모두 dialog의 close()를 직접 불러 이 native 'close'
	   이벤트로 모인다. 압축이 진행 중이었다면 여기서 끊어야 완료 처리가
	   뒤늦게 이어지지 않는다. */
	const handleDialogClose = () => {
		abort.current.abort();

		onClose();
	};

	/* 열림/닫힘 상태는 부모가 들고 있다. 여기서는 항상 onClose로 알리기만 한다. */
	const requestClose = () => {
		dialogRef.current?.close();
	};

	/* ::backdrop 클릭은 dialog 자신을 target으로 만든다. 실제 내용 영역 밖을 눌렀을 때만 닫는다. */
	const handleBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
		const dialog: HTMLDialogElement | null = dialogRef.current;

		if (dialog === null || e.target !== dialog) {
			return;
		}

		const rect: DOMRect = dialog.getBoundingClientRect();
		const insideDialog: boolean = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

		if (!insideDialog) {
			dialog.close();
		}
	};

	const handleTypeChange = (nextType: ImageType) => {
		setImageType(nextType);

		if (nextType !== "s") {
			setFrame("square");
		}
	};

	const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const inputTag: HTMLInputElement = e.target;
		const file: File | undefined = inputTag.files?.[0];

		try {
			if (!file) {
				throw new Error("파일을 첨부해 주세요.");
			}

			if (!IMAGE_ACCEPTED_TYPES.includes(file.type as (typeof IMAGE_ACCEPTED_TYPES)[number])) {
				throw new Error("PNG, JPG, WEBP 이미지만 사용할 수 있어요.");
			}

			if (file.size > IMAGE_MAX_FILE_SIZE) {
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

				URL.revokeObjectURL(objectUrl);

				if (imgTag.naturalWidth > IMAGE_MAX_DIMENSION || imgTag.naturalHeight > IMAGE_MAX_DIMENSION) {
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

			setFileName(file.name);
			setSourceImage(imgTag);
		} catch (err) {
			if (err instanceof Error) {
				setErrorMessage(err.message);
			}
		} finally {
			inputTag.value = "";

			setIsReadingFile(false);
		}
	};

	const handleReplace = () => {
		setSourceImage(null);
		setFileName("");
		setErrorMessage("");

		if (fileInputRef.current !== null) {
			fileInputRef.current.value = "";
		}
	};

	const editorPoint = (e: PointerEvent<HTMLDivElement>): {x: number; y: number} => {
		const rect: DOMRect = canvasWrapRef.current?.getBoundingClientRect() ?? new DOMRect();

		return {
			x: clamp(e.clientX - rect.left, 0, displaySize.width),
			y: clamp(e.clientY - rect.top, 0, displaySize.height),
		};
	};

	const handleSelectionPointerDown = (e: PointerEvent<HTMLDivElement>) => {
		e.preventDefault();

		const target: HTMLElement = e.target as HTMLElement;
		const handleAttribute: string | null | undefined = target.closest("[data-handle]")?.getAttribute("data-handle");
		const handle: Handle | "move" = (handleAttribute as Handle | null) ?? "move";
		const point: {x: number; y: number} = editorPoint(e);

		dragStateRef.current = {
			handle,
			startX: point.x,
			startY: point.y,
			crop: {...crop},
		};

		e.currentTarget.setPointerCapture(e.pointerId);
	};

	const handleSelectionPointerMove = (e: PointerEvent<HTMLDivElement>) => {
		const drag: DragState | null = dragStateRef.current;

		if (drag === null) {
			return;
		}

		e.preventDefault();

		const point: {x: number; y: number} = editorPoint(e);

		if (drag.handle === "move") {
			setCrop({
				...drag.crop,
				x: clamp(drag.crop.x + point.x - drag.startX, 0, displaySize.width - drag.crop.width),
				y: clamp(drag.crop.y + point.y - drag.startY, 0, displaySize.height - drag.crop.height),
			});
		} else {
			setCrop(resizeCrop(drag.crop, drag.handle, point, displaySize, definition.ratio));
		}
	};

	const handleSelectionPointerUp = () => {
		dragStateRef.current = null;
	};

	const handleSelectionKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (!e.key.startsWith("Arrow")) {
			return;
		}

		e.preventDefault();

		const amount: number = e.shiftKey ? 10 : 1;

		let dx: number = 0;
		let dy: number = 0;

		dx = e.key === "ArrowLeft" ? -amount : dx;
		dx = e.key === "ArrowRight" ? amount : dx;

		dy = e.key === "ArrowUp" ? -amount : dy;
		dy = e.key === "ArrowDown" ? amount : dy;

		setCrop((previous) => ({
			...previous,
			x: clamp(previous.x + dx, 0, displaySize.width - previous.width),
			y: clamp(previous.y + dy, 0, displaySize.height - previous.height),
		}));
	};

	const handleApply = async () => {
		setErrorMessage("");
		setIsApplying(true);

		try {
			if (sourceImage === null) {
				throw new Error("이미지를 가져오지 못했어요. 다시 시도해 주세요.");
			}

			const canvas: HTMLCanvasElement = document.createElement("canvas");

			canvas.width = definition.width;
			canvas.height = definition.height;

			const context: CanvasRenderingContext2D | null = canvas.getContext("2d");

			if (context === null) {
				throw new Error("이미지를 가져오지 못했어요. 다시 시도해 주세요.");
			}

			const scaleX: number = sourceImage.naturalWidth / displaySize.width;
			const scaleY: number = sourceImage.naturalHeight / displaySize.height;

			if (frame === "circle") {
				context.beginPath();
				context.ellipse(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2, 0, 0, Math.PI * 2);
				context.clip();
			}

			context.drawImage(sourceImage, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, canvas.width, canvas.height);

			const blob: Blob = await toBlob(canvas, fileName, abort.current.signal);

			onApply({
				image: blob,
				imageType,
				imageFrame: frame,
			});
		} catch (err) {
			/* 압축 도중에 다이얼로그가 닫혀 취소된 경우라 사용자가 의도한
			   동작이다. 오류로 보여줄 필요가 없다. */
			if (abort.current.signal.aborted) {
				return;
			} else if (err instanceof Error) {
				setErrorMessage(err.message);
			}
		} finally {
			setIsApplying(false);
		}
	};

	function renderTypeGrid(idPrefix: string, compact: boolean) {
		return (
			<div className={compact ? styles.type_grid_compact : styles.type_grid}>
				{IMAGE_TYPES.map((type) => (
					<label key={`${idPrefix}-${type}`} className={styles.type_option}>
						<input type="radio" name={`${idPrefix}-imageType`} checked={imageType === type} onChange={() => handleTypeChange(type)} />

						<span className={`${styles.ratio_sample} ${styles[`ratio_${type}`]}`} style={{aspectRatio: IMAGE_TYPE_DEFINITIONS[type].ratio}} aria-hidden="true" />

						<span>
							<b>{IMAGE_TYPE_DEFINITIONS[type].label}</b>

							<small>{IMAGE_TYPE_DEFINITIONS[type].hint}</small>
						</span>
					</label>
				))}
			</div>
		);
	}

	return (
		<dialog ref={dialogRef} className={styles.backdrop} aria-labelledby={titleId} onClose={handleDialogClose} onClick={handleBackdropClick}>
			<div className={styles.head}>
				<div>
					<h2 id={titleId}>캐릭터 이미지 편집</h2>

					<p>프로필에 사용할 이미지 유형과 보이는 영역을 정해 주세요.</p>
				</div>

				<button type="button" className={styles.close} aria-label="이미지 편집 닫기" onClick={requestClose}>
					<i className="bi bi-x-lg" aria-hidden="true"></i>
				</button>
			</div>

			<div className={styles.body}>
				{sourceImage === null ? (
					<div className={styles.setup}>
						<fieldset className={styles.type_fieldset}>
							<legend>이미지 유형</legend>

							<p className={styles.help}>유형에 따라 보이는 영역의 비율이 정해져요. 나중에 편집 화면에서도 바꿀 수 있어요.</p>

							{renderTypeGrid("setup", false)}
						</fieldset>

						<div className={styles.file_picker}>
							<input ref={fileInputRef} type="file" accept={IMAGE_ACCEPTED_TYPES.join(",")} className={styles.hidden_input} onChange={handleFileChange} />

							<ActionButton styleType="attention" disabled={isReadingFile} onClick={() => fileInputRef.current?.click()}>
								{isReadingFile ? "이미지 읽는 중" : "이미지 선택"}
							</ActionButton>

							<p>PNG, JPG, WEBP / 최대 10MB 및3000x3000px 이하</p>

							<p role="alert" className={styles.error}>
								{errorMessage}
							</p>
						</div>
					</div>
				) : (
					<div className={styles.workspace}>
						<div className={styles.grid}>
							<section className={styles.panel} aria-labelledby={cropHeadingId}>
								<div className={styles.section_head}>
									<div>
										<h3 id={cropHeadingId}>보이는 영역</h3>

										<p>모서리를 끌어 크기를 조절하고, 영역 안쪽을 끌어 위치를 옮기세요.</p>
									</div>

									<span>{definition.label}</span>
								</div>

								<div className={styles.stage} ref={stageRef}>
									<div className={styles.canvas_wrap} ref={canvasWrapRef} style={{width: displaySize.width, height: displaySize.height}}>
										<canvas ref={canvasRef} aria-label="업로드한 이미지 영역 편집기" />

										<div className={styles.shade} style={shade.top}></div>
										<div className={styles.shade} style={shade.right}></div>
										<div className={styles.shade} style={shade.bottom}></div>
										<div className={styles.shade} style={shade.left}></div>

										<div
											className={`${styles.selection} ${frame === "circle" ? styles.selection_ellipse : ""}`}
											style={{left: crop.x, top: crop.y, width: crop.width, height: crop.height}}
											tabIndex={0}
											role="group"
											aria-label="선택 영역. 드래그하거나 화살표 키로 옮기고, 모서리를 끌어 크기를 바꿀 수 있습니다."
											onPointerDown={handleSelectionPointerDown}
											onPointerMove={handleSelectionPointerMove}
											onPointerUp={handleSelectionPointerUp}
											onPointerCancel={handleSelectionPointerUp}
											onKeyDown={handleSelectionKeyDown}>
											<button type="button" className={`${styles.handle} ${styles.handle_nw}`} data-handle="nw" aria-label="왼쪽 위 모서리 조절"></button>
											<button type="button" className={`${styles.handle} ${styles.handle_ne}`} data-handle="ne" aria-label="오른쪽 위 모서리 조절"></button>
											<button type="button" className={`${styles.handle} ${styles.handle_sw}`} data-handle="sw" aria-label="왼쪽 아래 모서리 조절"></button>
											<button type="button" className={`${styles.handle} ${styles.handle_se}`} data-handle="se" aria-label="오른쪽 아래 모서리 조절"></button>
										</div>
									</div>
								</div>
							</section>

							<aside className={styles.controls} aria-labelledby={controlsHeadingId}>
								<fieldset className={styles.type_fieldset}>
									<legend id={controlsHeadingId}>이미지 유형</legend>

									{renderTypeGrid("workspace", true)}
								</fieldset>

								<fieldset className={styles.frame_fieldset}>
									<legend>프레임</legend>

									{imageType === "s" ? (
										<div className={styles.frame_list}>
											<label className={styles.frame_option}>
												<input type="radio" name="editorFrame" checked={frame === "square"} onChange={() => setFrame("square")} />

												<span className={`${styles.frame_sample} ${styles.frame_sample_square}`} aria-hidden="true" />

												<span>
													<b>사각형</b>

													<small>기본 프레임</small>
												</span>
											</label>

											<label className={styles.frame_option}>
												<input type="radio" name="editorFrame" checked={frame === "circle"} onChange={() => setFrame("circle")} />

												<span className={`${styles.frame_sample} ${styles.frame_sample_circle}`} aria-hidden="true" />

												<span>
													<b>타원</b>

													<small>부드러운 인물 프레임</small>
												</span>
											</label>
										</div>
									) : (
										<p className={styles.frame_note}>정사각형 유형에서만 타원 프레임을 고를 수 있어요. 지금은 사각형으로 적용돼요.</p>
									)}
								</fieldset>

								<dl className={styles.summary}>
									<dt>파일</dt>

									<dd>{fileName}</dd>

									<dt>사이즈</dt>

									<dd>
										{cropPixelSize.width} × {cropPixelSize.height}px
									</dd>

									<dt>비율</dt>

									<dd>{formatRatio(definition.ratio, imageType)}</dd>
								</dl>
							</aside>
						</div>

						<p role="alert" className={`${styles.error} ${styles.apply_error}`}>
							{errorMessage}
						</p>

						<div className={styles.actions}>
							<ActionButton onClick={handleReplace} disabled={isApplying}>
								다른 이미지 선택
							</ActionButton>

							<div className={styles.action_group}>
								<ActionButton onClick={requestClose}>취소</ActionButton>

								<ActionButton styleType="attention" disabled={isApplying} onClick={handleApply}>
									{isApplying ? "적용하는 중" : "완료"}
								</ActionButton>
							</div>
						</div>
					</div>
				)}
			</div>
		</dialog>
	);
}
