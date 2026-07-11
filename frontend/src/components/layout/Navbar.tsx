"use client"

import { useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { CalendarRange, Menu, X, LayoutDashboard, LogOut } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { logoutUser } from "@/features/auth/authSlice"
import { Button } from "@/components/common/ui"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import clsx from "clsx"

const dashboardPath: Record<string, string> = {
  USER: "/user",
  ORGANIZER: "/organizer",
  ADMIN: "/admin",
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const publicLinks = [
    { to: "/events", label: "events" },
    { to: "/about", label: "about" },
    { to: "/contact", label: "contact" },
  ]

  const handleLogout = () => {
    localStorage.removeItem("eventhub_token")
    localStorage.removeItem("eventhub_user")
    dispatch(logoutUser())
    setOpen(false)
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 md:px-6">
      <nav
        className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-2xl border border-border bg-card/85 px-3 shadow-lg shadow-black/5 backdrop-blur-md md:px-4"
        aria-label="Main navigation"
      >
        <Link
          to={user ? dashboardPath[user.role] || "/user" : "/"}
          className="flex items-center gap-2.5 font-extrabold tracking-tight text-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarRange className="size-4" aria-hidden="true" />
          </span>
          <span>
            Event<span className="text-primary">Hub</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {publicLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                clsx(
                  "rounded-full px-3.5 py-1.5 font-mono text-sm transition-colors",
                  isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

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

      {open && (
        <div className="mx-auto mt-2 max-w-6xl rounded-2xl border border-border bg-card px-4 py-3 shadow-lg md:hidden">
          <div className="flex flex-col gap-1">
            {publicLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    "rounded-lg px-3 py-2 font-mono text-sm",
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground",
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
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
          </div>
        </div>
      )}
    </header>
  )
}
