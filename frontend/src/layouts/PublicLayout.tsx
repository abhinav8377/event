import { Navigate, Outlet, useLocation } from "react-router-dom"
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

  if (user && location.pathname === "/") {
    return <Navigate to={dashboardPath[user.role] || "/user"} replace />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
