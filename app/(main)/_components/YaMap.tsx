import { Map } from "@iminside/react-yandex-maps"
import type { MapProps } from "@/types"

export default function YaMap(props: MapProps) {
  return (
    <Map
      defaultState={{ center: [55.75, 37.57], zoom: 9 }}
      width="100vw"
      height="100vh"
      {...props}
    />
  )
}
