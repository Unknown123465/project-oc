import {defineConfig} from "vitest/config";
import {fileURLToPath} from "node:url";

export default defineConfig({
	resolve: {
		/* tsconfig의 paths는 vite가 읽지 않는다. "@/"를 여기서 한 번 더 알려 주지
		   않으면 절대 경로로 import하는 모듈이 테스트에서만 해석되지 않는다. */
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		/* 지금 테스트 대상은 검증 스키마와 순수 함수뿐이라 DOM이 필요 없다.
		   브라우저 전용 모듈(크롭 캔버스 등)을 다루게 되면 그때 환경을 나눈다. */
		environment: "node",
		include: ["src/**/*.test.ts"],
	},
});
