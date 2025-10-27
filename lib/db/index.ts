import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

async function main() {
  const client = postgres(process.env.DB_URL, { prepare: false })
  const db = drizzle(client)
}

main()
