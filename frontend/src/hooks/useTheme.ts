"use client"

import { useSyncExternalStore } from "react"

type Theme = "dark" | "light"

const listeners = new Set<() => void>()

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark"
  const stored = window.localStorage.getItem("eventhub-theme")
  return stored === "light" ? "light" : "dark"
}

let currentTheme: Theme = getStoredTheme()

export function applyTheme(theme: Theme) {
  currentTheme = theme
  document.documentElement.classList.toggle("dark", theme === "dark")
  window.localStorage.setItem("eventhub-theme", theme)
  listeners.forEach((l) => l())
}

export function initTheme() {
  document.documentElement.classList.toggle("dark", currentTheme === "dark")
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => currentTheme,
    () => "dark" as Theme,
  )
  return { theme, toggle: () => applyTheme(theme === "dark" ? "light" : "dark") }
}
