"use client"

import "dotenv/config"
import { YMaps } from "@iminside/react-yandex-maps"
import YaMap from "./_components/YaMap"
import Link from "next/link"
import Header from "./_components/Header"
import Sidebar from "./_components/Sidebar"

export default function Home() {
  return (
    <>
      {/* <Header /> */}
      <Sidebar />
      {/* <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YMAPS_API_KEY }}>
        <YaMap />
      </YMaps> */}
    </>
  )
}
