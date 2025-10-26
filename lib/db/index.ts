import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import "dotenv/config"

async function main() {
  const client = postgres(process.env.DB_URL, { prepare: false })
  const db = drizzle(client)
}

main()
