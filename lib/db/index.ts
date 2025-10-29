import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import "dotenv/config"
import credentials from "./credentials.ts"
async function main() {
  const client = postgres({ ...credentials, prepare: false })
  const db = drizzle(client)
}

main()
