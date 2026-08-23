import dotenv from "dotenv";

const envMode = process.env.NODE_ENV === "production" ? "production" : "local";
dotenv.config({ path: `.env.${envMode}` });
