"use client"

import "dotenv/config"
import { YMaps } from "@iminside/react-yandex-maps"
import YaMap from "./_components/YaMap"

export default function Home() {
  return (
    <>
      <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YMAPS_API_KEY }}>
        <YaMap />
      </YMaps>
    </>
  )
}
