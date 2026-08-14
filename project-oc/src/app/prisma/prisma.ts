import db from "./client";
import {withAccelerate} from "@prisma/extension-accelerate";

export const prisma = db.$extends(withAccelerate());
