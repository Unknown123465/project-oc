import {type NextRequest, NextResponse, type ProxyConfig} from "next/server";
import {MUSIC_EMBED_ORIGINS} from "@/app/create/musicEmbed";
import {r2Endpoint} from "@/app/create/r2Endpoint";

export function proxy(req: NextRequest) {
	const SELF = "'self'" as const;
	const UNSAFE_INLINE = "'unsafe-inline'" as const;
	const UNSAFE_EVAL = "'unsafe-eval'" as const;

	/* 서명된 URL로 올리고 내려받는 주소와, 공개 버킷에 붙인 커스텀 도메인.
	   환경 변수가 비어 있으면 빈 문자열이 되고 아래에서 걸러진다. */
	const R2_ENDPOINT: string = r2Endpoint();
	const R2_PUBLIC_URL: string = process.env.R2_PUBLIC_URL ?? "";

	const cspList: string[][] = [
		["default-src", SELF],
		["script-src", SELF, UNSAFE_INLINE, "https://cdn.jsdelivr.net", process.env.NODE_ENV === "development" ? UNSAFE_EVAL : ""],
		["style-src", SELF, UNSAFE_INLINE],
		["img-src", SELF, "blob:", R2_PUBLIC_URL, R2_ENDPOINT],
		["worker-src", SELF, "blob:"],
		/* 이미지를 브라우저가 R2로 직접 PUT 한다. 이 줄이 없으면 default-src의
		   'self'에 걸려 업로드가 조용히 실패한다. */
		["connect-src", SELF, R2_ENDPOINT],
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
