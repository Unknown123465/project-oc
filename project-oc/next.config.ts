import type {NextConfig} from "next";

/* next의 공개 타입은 RemotePattern을 따로 내보내지 않는다. images.remotePatterns의
   원소 타입을 NextConfig에서 그대로 뽑아 써야 dist 내부 경로(비공개 타입)를 직접
   import하지 않는다. */
type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

/* next/image는 허용 목록에 없는 호스트를 통째로 거부한다. R2는 두 호스트로 갈린다 —
   공개 버킷은 커스텀 도메인 고정 주소, 일부공개·비공개는 계정 엔드포인트에 경로 방식
   버킷 이름이 붙는 서명 주소(src/app/create/r2.ts의 forcePathStyle). 이 파일은 앱
   번들과 별도로 실행되어 "@/" alias가 안 걸리므로 같은 env를 여기서 다시 조합한다.

   env가 비어 있어도(R2를 아직 안 쓰는 개발 환경) 빌드가 죽으면 안 되므로 new URL이
   던지면 그 항목만 조용히 뺀다. */
function toRemotePattern(rawUrl: string): RemotePattern | null {
	try {
		const url: URL = new URL(rawUrl);

		return {protocol: url.protocol === "http:" ? "http" : "https", hostname: url.hostname, pathname: "/**"};
	} catch {
		return null;
	}
}

const r2AccountId: string | undefined = process.env.R2_ACCOUNT_ID;
const r2Endpoint: string = r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : "";
const r2PublicUrl: string = process.env.R2_PUBLIC_URL ?? "";

const remotePatterns: RemotePattern[] = [toRemotePattern(r2Endpoint), toRemotePattern(r2PublicUrl)].filter((pattern): pattern is RemotePattern => pattern !== null);

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	allowedDevOrigins: ["127.0.0.1", "localhost"],
	experimental: {
		useLightningcss: true,
		lightningCssFeatures: {
			exclude: ["light-dark"],
		},
		/* AI 프로필 초안의 참고 이미지가 FormData로 서버 액션에 실린다. 기본 1MB로는
		   부족하고, Vercel 함수 본문 한도 4.5MB(유료 플랜도 동일)는 넘을 수 없으므로
		   브라우저에서 1024px·0.8MB 안팎으로 축소한 뒤 보낸다. 2mb는 그 축소본과
		   multipart 오버헤드(10~20KB)를 더한 값에 여유를 둔 것. */
		serverActions: {
			bodySizeLimit: "2mb",
		},
	},
	images: {
		remotePatterns,
	},
};

export default nextConfig;
