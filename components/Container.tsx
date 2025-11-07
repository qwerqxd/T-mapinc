import { cn } from "@/lib/utils"
import { ReactNode } from "react"

export default function Container({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1500px] px-4 sm:px-4 lg:px-6", className)}>
      {children}
    </div>
  )
}
