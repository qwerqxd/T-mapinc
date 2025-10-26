import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"
import eslintConfigPrettier from "eslint-config-prettier"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    extends: ["plugin:@next/next/core-web-vitals"],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  eslintConfigPrettier,
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
]

export default eslintConfig
