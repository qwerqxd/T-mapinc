import { defineConfig } from "drizzle-kit"
import credentials from "./lib/db/credentials"

export default defineConfig({
  out: "./lib/db/migrations",
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: credentials,
})
