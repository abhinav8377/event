import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAppSelector } from "@/app/store"
import type { Role } from "@/constants/types"

export default function ProtectedRoute({ allowedRoles }: { allowedRoles: Role[] }) {
  const { user, token } = useAppSelector((s) => s.auth)
  const location = useLocation()

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}
