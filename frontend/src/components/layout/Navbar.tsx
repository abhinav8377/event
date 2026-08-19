"use client"

import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import clsx from "clsx"
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { logoutUser } from "@/features/auth/authSlice"
import { Button } from "@/components/common/ui"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import { BrandMark } from "@/components/common/BrandMark"
import { useClerk } from "@clerk/clerk-react"

const dashboardPath: Record<string, string> = {
  USER: "/user",
  ORGANIZER: "/organizer",
  ADMIN: "/admin",
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const clerkEnabled = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  const { signOut } = clerkEnabled ? useClerk() : { signOut: null }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleLogout = async () => {
    await dispatch(logoutUser())
    if (signOut) await signOut()
    setOpen(false)
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 md:px-6">
      <nav
        className={clsx(
          "mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-2xl px-3 transition-all duration-300 md:px-4",
          scrolled
            ? "border border-border bg-card/95 shadow-xl shadow-black/20 backdrop-blur-md"
            : "border border-transparent bg-transparent shadow-none backdrop-blur-none",
        )}
        aria-label="Main navigation"
      >
        <Link
          to={user ? dashboardPath[user.role] || "/user" : "/"}
          className="group flex items-center"
        >
          <BrandMark
            iconClassName="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
          />
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate(dashboardPath[user.role])}>
                <LayoutDashboard className="size-4" aria-hidden="true" />
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="size-4" aria-hidden="true" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Sign up free
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="rounded-lg p-2 text-foreground"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-2 max-w-6xl rounded-2xl border border-border bg-card px-4 py-3 shadow-lg md:hidden"
          >
            <div className="flex flex-col gap-2">
              {user ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => { setOpen(false); navigate(dashboardPath[user.role]) }}>
                    Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => { setOpen(false); navigate("/login") }}>
                    Log in
                  </Button>
                  <Button size="sm" onClick={() => { setOpen(false); navigate("/register") }}>
                    Sign up free
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}