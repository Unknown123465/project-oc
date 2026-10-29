import type {CSSProperties} from "react";
import type {TemplateCharacter} from "@/app/_components/template/CharacterProfile";
import type {UseImageDataURL} from "@/hooks/useImageDataURL";

/** 카드에 쓰는 필드만 고른다. 테마곡(iframe은 PNG에 안 담김)은 뺀다. */
export type CardCharacter = Omit<TemplateCharacter, "charMusic">;

/** 유형별 상위 컴포넌트 3개가 똑같이 받는 prop */
export interface ProfileCardLayoutProps {
	character: CardCharacter;
	imageDataURL: UseImageDataURL;
}

function toLinear(value: number): number {
	const srgb: number = value / 255;

	return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/** 명암비는 https://www.w3.org/TR/WCAG22/#dfn-relative-luminance 를 참고한다.
   상대 휘도 공식은 0.2126 * R + 0.7152 * G + 0.0722 * B이다. */
function getRelativeLuminance(red: number, green: number, blue: number): number {
	return RGB_FLOAT_NUMBER.red * toLinear(red) + RGB_FLOAT_NUMBER.green * toLinear(green) + RGB_FLOAT_NUMBER.blue * toLinear(blue);
}

const RGB_FLOAT_NUMBER = {
	red: 0.2126,
	green: 0.7152,
	blue: 0.0722,
} as const;

const BRIGHT_CONTRAST_RATIO = getRelativeLuminance(255, 255, 255);

/** 색 보정 여부 판단은 (L1 + 0.05) / (L2 + 0.05)으로 판단하며, 이름(큰 글자)은 3을 넘으면 통과 하고,
   나머지는 4.5를 넘으면 통과한다 */
const SUCCESS_CRITERION = {
	bigText: 3,
	other: 4.5,
} as const;

const DECREMENT_NUMBER_BY_TEXTTYPE = {
	bigText: 3,
	other: 4,
} as const;

function toHexString(value: number): string {
	return value.toString(16).padStart(2, "0");
}

/** 색 보정은 https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html 를 참고한다. */
export function colorCorrection(color: string, textType: "bigText" | "other"): string {
	let red: number = parseInt(color.substring(1, 3), 16);
	let green: number = parseInt(color.substring(3, 5), 16);
	let blue: number = parseInt(color.substring(5), 16);

	let darkContrastRatio: number = getRelativeLuminance(red, green, blue);
	let finalContrastRatio: number = (BRIGHT_CONTRAST_RATIO + 0.05) / (darkContrastRatio + 0.05);

	while (SUCCESS_CRITERION[textType] > finalContrastRatio) {
		red -= DECREMENT_NUMBER_BY_TEXTTYPE[textType];
		green -= DECREMENT_NUMBER_BY_TEXTTYPE[textType];
		blue -= DECREMENT_NUMBER_BY_TEXTTYPE[textType];

		red = Math.max(red, 0);
		green = Math.max(green, 0);
		blue = Math.max(blue, 0);

		darkContrastRatio = getRelativeLuminance(red, green, blue);
		finalContrastRatio = (BRIGHT_CONTRAST_RATIO + 0.05) / (darkContrastRatio + 0.05);
	}

	red = Math.trunc(red);
	green = Math.trunc(green);
	blue = Math.trunc(blue);

	return "#" + toHexString(red) + toHexString(green) + toHexString(blue);
}

/** 카드 바깥 띠와 글자색을 CSS 변수로 넘긴다. */
export function cardColorStyle(charColor: string): CSSProperties {
	return {
		"--char-title": colorCorrection(charColor, "bigText"),
		"--char-color": charColor,
		"--char-back": charColor,
		"--char-text": colorCorrection(charColor, "other"),
	};
}

/** PNG 파일 이름. 파일 이름에 못 쓰는 글자와 제어 문자를 지우고, 남는 글자가 없으면 기본 이름을 쓴다. */
export function toCharFileName(name: string): string {
	const charName: string = name.replaceAll(/[<>:"\/\\|\?\*\x00-\x1f]/g, "").trim();
	const fileName: string = charName !== "" ? `${charName} 카드 - 프로젝트 OC.png` : "프로필 카드 - 프로젝트 OC.png";

	return fileName;
}
