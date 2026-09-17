import {createClient, type EdgeConfigClient} from "@vercel/global-config";

const VERCEL_CONFIG_STORE_URL = process.env.VERCEL_CONFIG_STORE_URL;

let globalConfig: EdgeConfigClient | null = null;

try {
	globalConfig = createClient(VERCEL_CONFIG_STORE_URL);
} catch (err) {
	console.warn("[globalConfig] Global Config 연결 문자열이 없거나 잘못됨 - AI 초안 킬 스위치를 켜짐으로 처리합니다.", err);

	globalConfig = null;
}

const AI_DRAFT_ENABLED = "AI_DRAFT_ENABLED" as const;

export async function getAiDraftEnabled(): Promise<boolean> {
	try {
		if (globalConfig === null) {
			return true;
		}

		const aiDraftEnabled: boolean | undefined = await globalConfig.get(AI_DRAFT_ENABLED);

		return aiDraftEnabled === true;
	} catch (err) {
		console.warn("[globalConfig] AI_DRAFT_ENABLED 읽기 실패 - 켜짐으로 처리합니다.", err);

		return true;
	}
}
