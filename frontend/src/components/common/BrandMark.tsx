"use client"

import clsx from "clsx"
import { useTheme } from "@/hooks/useTheme"

interface BrandMarkProps {
  iconClassName?: string
  textClassName?: string
  showText?: boolean
  className?: string
  /** Force a specific logo variant instead of following the site theme — for surfaces
   * like the dashboard sidebar that are always dark regardless of light/dark mode. */
  forceVariant?: "light" | "dark"
}

export function BrandMark({ iconClassName, textClassName, showText = true, className, forceVariant }: BrandMarkProps) {
  const { theme } = useTheme()
  const variant = forceVariant ?? theme
  const src = variant === "dark" ? "/images/logo-icon-dark.png" : "/images/logo-icon-light.png"

  return (
    <span className={clsx("flex items-center gap-2.5", className)}>
      <img
        src={src}
        alt="EventHub"
        className={clsx("size-8 shrink-0 object-contain", iconClassName)}
      />
      {showText && (
        <span className={clsx("font-extrabold tracking-tight text-foreground", textClassName)}>
          Event<span className="text-primary">Hub</span>
        </span>
      )}
    </span>
  )
}
