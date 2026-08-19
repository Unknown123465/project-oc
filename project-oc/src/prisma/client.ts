import { env } from "@prisma/config";
import { PrismaClient } from "./generated/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const db = new PrismaClient({
    adapter: new PrismaMariaDb({
        host: env("DATABASE_HOST"),
        user: env("DATABASE_USER"),
        database: env("DATABASE_NAME"),
        password: env("DATABASE_PASSWORd"),
        allowPublicKeyRetrieval: true,
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
