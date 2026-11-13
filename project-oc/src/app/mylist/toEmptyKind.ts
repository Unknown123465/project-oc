import type {MyListEmptyKind} from "../_components/mylist/MyListEmpty";

export function toEmptyKind(query: Record<string, string | string[] | undefined>): MyListEmptyKind {
	if (query.keyword) {
		return "search";
	} else if (typeof query.public_mode === "string" && query.public_mode !== "all") {
		return "filter";
	} else {
		return "none";
	}
}
