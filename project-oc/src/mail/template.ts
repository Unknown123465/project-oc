import "server-only";
import fs from "fs/promises";
import path from "path";

/* 메일 본문은 src/mail/templates 아래 HTML 파일로 둔다. 받는 사람마다 달라지는 자리는
   {{이름}}으로 적어 두고, 보낼 때 값으로 바꾼다.

   배포 때 이 HTML 파일이 함수 번들에 들어가도록 next.config.ts의
   outputFileTracingIncludes에 경로를 넣어 두었다. */
const TEMPLATE_DIR: string = path.join(process.cwd(), "src", "mail", "templates");

export type MailTemplateName = "email-change" | "email-changed";

const PLACEHOLDER_PATTERN: RegExp = /\{\{([A-Z][A-Z0-9]*)\}\}/gi;

/* 사용자 이름처럼 사용자가 정한 값이 그대로 들어가므로 HTML로 해석되지 않게 바꾼다.
   SQL에서 값을 바인딩하듯, 자리만 템플릿이 정하고 값은 글자로만 들어간다. */
function escapeHtml(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

/** 템플릿을 읽어 {{이름}} 자리를 values의 값으로 채운다. 값이 없는 자리가 있으면 예외를 던진다.
 *  빈칸이 남은 채로 메일이 나가는 것보다 보내지 않는 쪽이 낫다. */
export async function renderMailTemplate(name: MailTemplateName, values: Record<string, string>): Promise<string> {
	let template: string = await fs.readFile(path.join(TEMPLATE_DIR, `${name}.html`), "utf8");

	const keys: Set<string> = new Set(Array.from(template.matchAll(PLACEHOLDER_PATTERN), (match) => match[1]));

	for (const key of keys) {
		const value: string | undefined = values[key];

		if (value === undefined) {
			throw new Error(`메일 템플릿 ${name}에 ${key} 값이 없어요.`);
		}

		/* 2번째 인자를 문자열로 전달할 때, value에 $가 들어가면 치환 패턴($& 등)으로 해석되어 값이 제대로 안 바뀐다. 따라서 2번째 인자를 문자열이 아닌 함수를 전달한다. */
		template = template.replaceAll(`{{${key}}}`, () => escapeHtml(value));
	}

	return template;
}
