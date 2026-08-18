import {type NextRequest, NextResponse, type ProxyConfig} from "next/server";

export function proxy(req: NextRequest) {
	let cspValue: string = `
    default-src 'self';
    script-src 'self';
    style-src 'self';
    img-src 'self';
    font-src 'self';
    form-action 'self';
    upgrade-insecure-requests;
    `;

	cspValue = cspValue.replaceAll(/\s{2,}/g, " ").trim();

	const reqHeader: Headers = new Headers(req.headers);

	reqHeader.set("Content-Security-Policy", cspValue);

	const res: NextResponse = NextResponse.next({
		request: {
			headers: reqHeader,
		},
	});

	res.headers.set("Content-Security-Policy", cspValue);

	return res;
}

export const config: ProxyConfig = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
