import {type NextRequest, NextResponse, type ProxyConfig} from "next/server";
import {MUSIC_EMBED_ORIGINS} from "@/app/create/musicEmbed";
import {r2Endpoint} from "@/app/create/r2Endpoint";

export function proxy(req: NextRequest) {
	const SELF = "'self'" as const;
	const NONE = "'none'" as const;
	const UNSAFE_INLINE = "'unsafe-inline'" as const;
	/* 따옴표가 없으면 CSP는 이 값을 키워드가 아니라 호스트 이름으로 읽는다.
	   그러면 strict-dynamic이 통째로 무시되고 아래 출처 목록이 그대로 살아난다. */
	const STRICT_DYNAMIC = "'strict-dynamic'" as const;
	const UNSAFE_EVAL = "'unsafe-eval'" as const;

	const R2_ENDPOINT: string = r2Endpoint();
	const R2_PUBLIC_URL: string = process.env.R2_PUBLIC_URL ?? "";

	const nonceValue: string = Buffer.from(crypto.randomUUID()).toString("base64");

	const NONCE: string = `'nonce-${nonceValue}'`;

	const cspList: string[][] = [
		["default-src", SELF],
		/* strict-dynamic이 붙으면 최신 브라우저는 아래 출처 목록을 무시하고 nonce만 본다.
		   출처를 남겨 두는 건 strict-dynamic을 모르는 구형 브라우저용 대비책이고,
		   jsdelivr은 browser-image-compression이 웹 워커 안에서 importScripts로
		   자기 자신을 받아오는 주소라 지우면 이미지 압축이 멈춘다. */
		["script-src", SELF, STRICT_DYNAMIC, "https://cdn.jsdelivr.net", process.env.NODE_ENV === "development" ? UNSAFE_EVAL : "", NONCE],
		/* 여기에는 nonce를 넣지 않는다. 목록에 nonce가 하나라도 있으면 브라우저가
		   unsafe-inline을 무시하는데, style="..." 속성에는 nonce를 붙일 방법이 없어
		   style={{"--bg": hex}} 같은 값 전달이 통째로 막힌다. */
		["style-src", SELF, UNSAFE_INLINE],
		/* browser-image-compression이 EXIF 방향 판독 등을 위해 FileReader로 읽은
		   이미지를 data: URL로 <img>에 실어 메인 스레드에서 그린다. 빠지면 압축
		   과정에서 이 부분만 조용히 막힌다. */
		["img-src", SELF, "blob:", "data:", R2_PUBLIC_URL, R2_ENDPOINT],
		["worker-src", SELF, "blob:"],
		/* 이미지를 브라우저가 R2로 직접 PUT 한다. 이 줄이 없으면 default-src의
		   'self'에 걸려 업로드가 조용히 실패한다. */
		["connect-src", SELF, R2_ENDPOINT],
		["font-src", SELF],
		["object-src", NONE],
		/* base-uri와 frame-ancestors는 default-src로 대체되지 않아 적지 않으면 무제한이다.
		   base가 열려 있으면 주입된 <base>로 상대 경로 스크립트를 다른 서버로 돌릴 수 있어
		   strict-dynamic을 우회당한다. */
		["base-uri", SELF],
		["form-action", SELF],
		["frame-ancestors", NONE],
		["frame-src", ...MUSIC_EMBED_ORIGINS],
		["upgrade-insecure-requests"],
	];

	const cspString: string = cspList.map((list) => list.filter((value) => value.trim()).join(" ")).join("; ");

	const reqHeader: Headers = new Headers(req.headers);

	reqHeader.set("x-nonce", nonceValue);
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
