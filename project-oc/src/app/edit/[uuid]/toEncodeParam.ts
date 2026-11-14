export function toEncodeParam(name: string, value: string[] | string | undefined | null, emptyValue: string | null = null): string {
	let urlValue: string | null = value ? value.toString() : "";
	urlValue ||= emptyValue;

	return urlValue !== null ? `${encodeURIComponent(name)}=${encodeURIComponent(urlValue)}&` : "";
}
