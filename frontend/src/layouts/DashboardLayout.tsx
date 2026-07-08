"use client"

import { useEffect, useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  CalendarRange,
  Menu,
  X,
  Bell,
  LogOut,
  type LucideIcon,
} from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { logoutUser } from "@/features/auth/authSlice"
import { fetchNotifications } from "@/features/notifications/notificationSlice"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import clsx from "clsx"

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export default function DashboardLayout({
  title,
  navItems,
}: {
  title: string
  navItems: NavItem[]
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAppSelector((s) => s.auth.user)
  const notifications = useAppSelector((s) => s.notifications.items)
  const unread = notifications.filter((n) => !n.read).length
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) dispatch(fetchNotifications(user.id))
  }, [dispatch, user])

  const notifPath =
    user?.role === "USER"
      ? "/user/notifications"
      : user?.role === "ORGANIZER"
        ? "/organizer/notifications"
        : "/admin/notifications"

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <Link to="/" className="flex items-center gap-2.5 font-extrabold tracking-tight text-white">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarRange className="size-4" aria-hidden="true" />
          </span>
          <span>
            Event<span className="text-primary">Hub</span>
          </span>
        </Link>
      </div>
      <p className="px-5 pb-2 pt-4 font-mono text-xs uppercase tracking-wider text-sidebar-foreground/60">
        {title}
      </p>
      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label={`${title} navigation`}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
              )
            }
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-sidebar-accent p-3">
          <button
            type="button"
            onClick={() => {
              dispatch(logoutUser())
              navigate("/")
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Logout
          </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-sidebar lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar shadow-xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-foreground lg:hidden"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <h1 className="text-sm font-semibold text-muted-foreground">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to={notifPath}
              className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
            >
              <Bell className="size-5" aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unread}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                {user?.name.charAt(0)}
              </span>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-tight text-foreground">{user?.name}</p>
                <p className="text-xs leading-tight text-muted-foreground">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
