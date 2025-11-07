import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/ThemeProvider"
import "./globals.css"

const inter = Inter({
  subsets: ["cyrillic", "latin"],
})

export const metadata: Metadata = {
  title: "T-mapinc",
  description: "Интерактивная карта с отзывами пользователей",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-text`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
