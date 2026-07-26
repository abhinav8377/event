import { Navigate, Outlet, useLocation } from "react-router-dom"
import clsx from "clsx"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { useAppSelector } from "@/app/store"

const dashboardPath: Record<string, string> = {
  USER: "/user",
  ORGANIZER: "/organizer",
  ADMIN: "/admin",
}

export default function PublicLayout() {
  const { user } = useAppSelector((s) => s.auth)
  const location = useLocation()

  if (user) {
    if (user.role === "USER") {
      return <Navigate to="/user" replace />
    }
    if (location.pathname === "/") {
      return <Navigate to={dashboardPath[user.role] || "/user"} replace />
    }
  }

  const isThemedRoute = ["/", "/about", "/contact"].includes(location.pathname)

  return (
    <div className={clsx("relative isolate flex min-h-screen flex-col", isThemedRoute && "theme-landing")}>
      {isThemedRoute && (
        <div
          className="fade-edge-bottom pointer-events-none absolute inset-x-0 top-0 -z-10 h-[960px] overflow-hidden"
          aria-hidden="true"
        >
          <div className="mesh-bg absolute inset-0" />
        </div>
      )}
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
