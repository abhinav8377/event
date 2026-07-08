"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import clsx from "clsx"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={clsx(
        "inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
    </button>
  )
}
