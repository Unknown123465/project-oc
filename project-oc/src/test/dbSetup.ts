import "dotenv/config";

/* DB 테스트 파일마다 그 파일이 import되기 전에 한 번 돈다(vitest.config.mts의 db 프로젝트 setupFiles).

   하는 일은 하나 - DATABASE_NAME을 테스트 전용 DB 이름으로 바꾼다. src/prisma/client.ts가
   import되는 순간 process.env를 읽어 클라이언트를 만들기 때문에, 테스트 파일 안에서 바꾸면 늦다.

   DATABASE_TEST_NAME이 없으면 돌지 않는다. 기본값으로 DATABASE_NAME을 쓰면 .env를 그대로 둔
   사람의 개발 DB에서 행을 심고 지우게 된다. 없을 때 조용히 개발 DB로 가는 것보다 시끄럽게
   서는 편이 낫다. 호스트 검사도 같은 이유다 - 이 테스트는 로컬 DB에서만 돌아야 한다.

   dotenv는 이미 있는 값을 덮어쓰지 않으므로 CI처럼 env를 직접 주는 환경에서는 .env가 없어도 된다. */

const testDbName: string | undefined = process.env.DATABASE_TEST_NAME;

if (!testDbName) {
	throw new Error("DATABASE_TEST_NAME이 없습니다. DB 테스트는 테스트 전용 DB 이름 없이는 돌지 않습니다. .env-example을 보세요.");
}

const host: string | undefined = process.env.DATABASE_HOST;

if (host !== "localhost" && host !== "127.0.0.1") {
	throw new Error(`DATABASE_HOST가 "${host}"입니다. DB 테스트는 로컬 DB에서만 돕니다.`);
}

process.env.DATABASE_NAME = testDbName;
