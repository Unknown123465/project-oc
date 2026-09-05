import type {CreateCharFormInputType} from "./validator";

export type ImageType = Exclude<CreateCharFormInputType["charProfileLayout"], "">;
export type ImageFrame = Exclude<CreateCharFormInputType["charImageFrame"], "">;

export interface ImageTypeDefinition {
	label: string;
	hint: string;
	/** 너비 / 높이. 보이는 영역을 이 비율로 고정한다. */
	ratio: number;
	/** 적용한 이미지가 실제로 저장될 크기. */
	width: number;
	height: number;
}

/* 유형을 늘리려면 이 배열과 아래 객체에 한 줄씩만 더하면 된다. */
export const IMAGE_TYPES: readonly ImageType[] = ["h", "v", "s"];

export const IMAGE_TYPE_DEFINITIONS: Record<ImageType, ImageTypeDefinition> = {
	h: {label: "가로형", hint: "넓은 장면과 상반신", ratio: 1 / 0.33, width: 1200, height: 396},
	v: {label: "세로형", hint: "전신 캐릭터", ratio: 1 / 1.938, width: 900, height: 1744},
	s: {label: "정사각형", hint: "얼굴과 대표 이미지", ratio: 1, width: 1000, height: 1000},
};

export const IMAGE_FRAME_LABEL: Record<ImageFrame, string> = {
	square: "사각형 프레임",
	circle: "타원 프레임",
};

/** 움짤은 크롭 결과가 정지 프레임 하나로 굳어 버려 받지 않는다. */
export const IMAGE_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export const IMAGE_MAX_FILE_SIZE = 10 * 1024 * 1024;

export const IMAGE_MAX_DIMENSION = 3000;
