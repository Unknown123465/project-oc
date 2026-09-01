import { PrismaClient } from "./generated/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const db = new PrismaClient({
    adapter: new PrismaMariaDb({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        database: process.env.DATABASE_NAME,
        password: process.env.DATABASE_PASSWORD,
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
