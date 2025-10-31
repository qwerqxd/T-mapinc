import { ComponentProps } from "react"
import { Map } from "@iminside/react-yandex-maps"
export type MapProps = Pick<
  ComponentProps<typeof Map>,
  | "state"
  | "defaultState"
  | "options"
  | "defaultOptions"
  | "width"
  | "height"
  | "style"
  | "className"
>
