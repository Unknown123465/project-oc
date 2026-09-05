import {type NextRequest, NextResponse, type ProxyConfig} from "next/server";
import {MUSIC_EMBED_ORIGINS} from "@/app/create/musicEmbed";

export function proxy(req: NextRequest) {
	const SELF = "'self'" as const;
	const UNSAFE_INLINE = "'unsafe-inline'" as const;
	const UNSAFE_EVAL = "'unsafe-eval'" as const;

	const cspList: string[][] = [
		["default-src", SELF],
		["script-src", SELF, UNSAFE_INLINE, process.env.NODE_ENV === "development" ? UNSAFE_EVAL : ""],
		["style-src", SELF, UNSAFE_INLINE],
		["img-src", SELF, "blob:"],
		["worker-src", SELF, "blob:"],
		["font-src", SELF],
		["form-action", SELF],
		["frame-src", ...MUSIC_EMBED_ORIGINS],
		["upgrade-insecure-requests"],
	];

	const cspString: string = cspList.map((list) => list.filter((value) => value.trim()).join(" ")).join("; ");

	const reqHeader: Headers = new Headers(req.headers);

	reqHeader.set("Content-Security-Policy", cspString);

	const res: NextResponse = NextResponse.next({
		request: {
			headers: reqHeader,
		},
	});

	res.headers.set("Content-Security-Policy", cspString);

	return res;
}

export const config: ProxyConfig = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
