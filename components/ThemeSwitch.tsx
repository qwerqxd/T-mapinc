"use client"
import { useTheme } from "next-themes"
import { useEffect, useId, useState } from "react"
import { SunMedium } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import MoonStar from "@/public/svg/MoonStar.svg"

export default function ThemeSwitch() {
  const id = useId()
  const { systemTheme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)
  const [activeTheme, setActiveTheme] = useState("default")

  const resolvedTheme = activeTheme === "default" ? systemTheme : activeTheme

  function handleChange() {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark"
    setActiveTheme(newTheme)
  }

  useEffect(() => {
    setHasMounted(true)
    const isDark = resolvedTheme === "dark"
    document.documentElement.classList.toggle("dark", isDark)
  }, [resolvedTheme, systemTheme])

  return (
    hasMounted && (
      <div>
        <div className="relative inline-grid h-9 grid-cols-[1fr_1fr] items-center text-sm font-medium">
          <Switch
            id={id}
            checked={resolvedTheme === "light"}
            onCheckedChange={handleChange}
            thumbClassName="bg-bw-700"
            className="peer data-[state=unchecked]:bg-input/50 absolute inset-0 order-2 h-[inherit] w-auto outline-2 outline-bw-300 transition-colors duration-500 ease-linear dark:outline-bw-400 [&_span]:z-10 [&_span]:h-full [&_span]:w-1/2 [&_span]:transition-all [&_span]:duration-400 [&_span]:ease-explosive [&_span]:data-[state=checked]:translate-x-full [&_span]:data-[state=checked]:rtl:-translate-x-full"
          />
          <span className="pointer-events-none relative ms-0.5 flex min-w-8 items-center justify-center text-center transition-transform duration-400 ease-explosive peer-data-[state=checked]:invisible peer-data-[state=unchecked]:translate-x-full peer-data-[state=unchecked]:rtl:-translate-x-full">
            <MoonStar />
          </span>
          <span className="pointer-events-none relative me-0.5 flex min-w-8 items-center justify-center text-center transition-transform duration-400 ease-explosive peer-data-[state=checked]:-translate-x-full peer-data-[state=checked]:text-background peer-data-[state=unchecked]:invisible peer-data-[state=checked]:rtl:translate-x-full">
            <SunMedium size={16} className="text-gray-950" />
          </span>
        </div>
        <Label htmlFor={id} className="sr-only">
          Переключатель темы
        </Label>
      </div>
    )
  )
}
