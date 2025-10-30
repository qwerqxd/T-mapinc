import "dotenv/config"
import type { Config } from "drizzle-kit"
import { readFileSync } from "node:fs"
import path from "node:path"

import chalk from "chalk"

type Credentials = Extract<Config, { dialect: "postgresql" }>["dbCredentials"]

const credentials: Credentials = {
  host: "aws-1-eu-north-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.egwfparcyilllmbbuudo",
  database: "postgres",
  password: process.env.DB_PASSWORD,
  ssl: {
    ca: readFileSync(path.resolve(import.meta.dirname, "./prod-ca-2021.crt")).toString(),
  },
}

export default credentials

console.log(chalk.red("We're on fire!!!"))
