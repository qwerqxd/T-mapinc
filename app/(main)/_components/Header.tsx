import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"
import PinIcon from "@/components/PinIcon"
import ThemeSwitch from "@/components/ThemeSwitch"
import Container from "@/components/Container"

export default function Header() {
  return (
    <header className="shadow shadow-bw-300/50">
      <Container className="flex items-center justify-between gap-4 py-3">
        <h1 className="text-2xl font-semibold">
          <Link
            href="/"
            className="flex items-baseline gap-x-2 px-2 transition-colors outline-none focus-visible:text-accent focus-visible:underline"
          >
            <PinIcon size="22" className="relative top-0.5" />
            T-mapinc
          </Link>
        </h1>
        <div className="flex gap-4">
          <ThemeSwitch />
          <nav>
            <ul className="flex gap-4">
              <li>
                <Button>
                  <Mail /> Обратная связь
                </Button>
              </li>
              <li>
                <Button asChild>
                  <Link href="/login">Войти</Link>
                </Button>
              </li>
              <li>
                <Button asChild>
                  <Link href="/register">Регистрация</Link>
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </Container>
    </header>
  )
}
