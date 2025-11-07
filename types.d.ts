declare namespace NodeJS {
  interface ProcessEnv {
    DB_PASSWORD: string
    SENTRY_AUTH_TOKEN: string
    NEXT_PUBLIC_YMAPS_API_KEY: string
  }
}

declare module "*.svg" {
  import { FC, SVGProps } from "react"
  export const ReactComponent: FC<SVGProps<SVGSVGElement>>
  const src: string
  export default src
}
