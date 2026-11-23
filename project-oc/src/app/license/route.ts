import fs from "node:fs/promises";
import path from "node:path";

/* 빌드할 때 한 번 읽어 정적 응답으로 만든다. 파일은 prebuild(generate-license-file)가 next build 앞에서 만든다. */
export const dynamic = "force-static";

const LICENSE_FILE_PATH: string = path.join(process.cwd(), "third-party-licenses.txt");

export async function GET(): Promise<Response> {
	try {
		const text: string = await fs.readFile(LICENSE_FILE_PATH, "utf-8");

		return new Response(text, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
			},
		});
	} catch {
		/* next dev에서는 빌드를 한 번 돌리기 전까지 파일이 없다. */
		return new Response("오픈소스 라이선스 파일이 아직 만들어지지 않았어요.", {
			status: 404,
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
			},
		});
	}
}
