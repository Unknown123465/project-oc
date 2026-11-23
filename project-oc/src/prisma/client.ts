import {PrismaClient} from "./generated/client";
import {PrismaMariaDb} from "@prisma/adapter-mariadb";

/* Vercel은 요청이 몰리면 함수 인스턴스를 여러 개 띄우고 인스턴스마다 풀을 따로 만든다.
   드라이버 기본값(10)이면 인스턴스 다섯 개만 떠도 운영 DB(Aiven Developer)의 max_connections 46을 넘는다.
   요청 하나는 연결 한두 개면 충분해서 5로 줄인다. */
const CONNECTION_LIMIT: number = 5;

/* 운영 DB(Aiven)는 TLS가 필수이고 서버 인증서를 Aiven 프로젝트 CA가 서명한다.
   CA로 검증하지 않으면 암호화는 되지만 중간에서 다른 서버가 끼어들어도 알 수 없다.
   로컬 MySQL은 TLS를 쓰지 않으므로 CA 환경 변수가 없으면 TLS 없이 연결한다. */
const caCert: string | undefined = process.env.DATABASE_CA_CERT;

const db = new PrismaClient({
	adapter: new PrismaMariaDb({
		host: process.env.DATABASE_HOST,
		port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 3306,
		user: process.env.DATABASE_USER,
		database: process.env.DATABASE_NAME,
		password: process.env.DATABASE_PASSWORD,
		connectionLimit: CONNECTION_LIMIT,
		ssl: caCert ? {ca: caCert, rejectUnauthorized: true} : undefined,
		allowPublicKeyRetrieval: !caCert,
		logger: {
			/*network: (info) => {
                console.log("PrismaAdapterNetwork", info);
            },
            query: (info) => {
                console.log("PrismaAdapterQuery", info);
            },
            error: (error) => {
                console.error("PrismaAdapterError", error);
            },
            warning: (info) => {
                console.warn("PrismaAdapterWarning", info);
            },*/
		},
	}),
});

export default db;
