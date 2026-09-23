import {configDefaults, defineConfig} from "vitest/config";
import {fileURLToPath} from "node:url";

/* 파일 이름으로 두 부류를 가른다 - *.db.test.ts는 실제 DB를 타고, 나머지 *.test.ts는 순수 함수다.
   한 번에 돌리지 않는 이유는 둘이다. DB 없는 환경에서 순수 함수 쪽까지 실행 실패로 묶이면
   안 되고, DB 쪽은 같은 사용자 행을 심고 지우기 때문에 파일끼리 나란히 돌면 서로를 망친다. */
export default defineConfig({
	resolve: {
		/* tsconfig의 paths는 vite가 읽지 않는다. "@/"를 여기서 한 번 더 알려 주지
		   않으면 절대 경로로 import하는 모듈이 테스트에서만 해석되지 않는다. */
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		/* 지금 테스트 대상은 검증 스키마·순수 함수·서버 액션이라 DOM이 필요 없다.
		   브라우저 전용 모듈(크롭 캔버스 등)을 다루게 되면 그때 환경을 나눈다. */
		environment: "node",
		projects: [
			{
				test: {
					name: "fn",
					include: ["src/**/*.test.ts"],
					exclude: [...configDefaults.exclude, "src/**/*.db.test.ts"],
				},
			},
			{
				test: {
					name: "db",
					include: ["src/**/*.db.test.ts"],
					/* 테스트 전용 DB 이름을 클라이언트가 만들어지기 전에 넣는다.
					   src/prisma/client.ts는 import되는 순간 process.env를 읽는다. */
					setupFiles: ["./src/test/dbSetup.ts"],
					/* 파일 단위 직렬 실행. 동시 요청 테스트는 한 파일 안에서만 동시여야 한다. */
					fileParallelism: false,
				},
			},
		],
	},
});
