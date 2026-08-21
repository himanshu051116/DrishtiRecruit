import bcrypt from "bcryptjs";

const COST = 12;
export const hashPassword = (password: string) => bcrypt.hash(password, COST);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);
