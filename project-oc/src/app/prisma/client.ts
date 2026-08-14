import {env} from "@prisma/config";
import {PrismaClient} from "./generated/client";
import {PrismaMariaDb} from "@prisma/adapter-mariadb";

const db = new PrismaClient({
	adapter: new PrismaMariaDb({
		host: env("DATABASE_URL"),
		user: env("DATABASE_USER"),
		database: env("DATABASE_NAME"),
	}),
});

export default db;
