import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import {
  LayoutDashboard,
  Ticket,
  Award,
  Bell,
  UserRound,
  CalendarRange,
  QrCode,
  BarChart3,
  Users,
  Megaphone,
  Shield,
  Search,
} from "lucide-react"
import PublicLayout from "@/layouts/PublicLayout"
import DashboardLayout, { type NavItem } from "@/layouts/DashboardLayout"
import ProtectedRoute from "@/routes/ProtectedRoute"
import { Toaster } from "@/components/common/Toaster"

import LandingPage from "@/pages/public/LandingPage"
import EventDetailPage from "@/pages/public/EventDetailPage"
import AboutPage from "@/pages/public/AboutPage"
import ContactPage from "@/pages/public/ContactPage"
import NotFoundPage from "@/pages/public/NotFoundPage"
import ForbiddenPage from "@/pages/public/ForbiddenPage"
import LoginPage from "@/pages/auth/LoginPage"
import RegisterPage from "@/pages/auth/RegisterPage"
import VerificationPendingPage from "@/pages/auth/VerificationPendingPage"

import UserDashboard from "@/pages/user/UserDashboard"
import MyRegistrations from "@/pages/user/MyRegistrations"
import MyCertificates from "@/pages/user/MyCertificates"
import BrowseEventsPage from "@/pages/user/BrowseEventsPage"

import OrganizerDashboard from "@/pages/organizer/OrganizerDashboard"
import OrganizerEvents from "@/pages/organizer/OrganizerEvents"
import EventFormPage from "@/pages/organizer/EventFormPage"
import AttendancePage from "@/pages/organizer/AttendancePage"
import OrganizerAnalytics from "@/pages/organizer/OrganizerAnalytics"
import OrganizerNotifications from "@/pages/organizer/OrganizerNotifications"

import AdminDashboard from "@/pages/admin/AdminDashboard"
import AdminUsers from "@/pages/admin/AdminUsers"
import AdminOrganizers from "@/pages/admin/AdminOrganizers"
import AdminEvents from "@/pages/admin/AdminEvents"
import AdminAnalytics from "@/pages/admin/AdminAnalytics"
import AdminNotifications from "@/pages/admin/AdminNotifications"
import AdminSecurity from "@/pages/admin/AdminSecurity"

import NotificationsPage from "@/pages/shared/NotificationsPage"
import ProfilePage from "@/pages/shared/ProfilePage"

const userNav: NavItem[] = [
  { to: "/user", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/user/browse", label: "Browse Events", icon: Search },
  { to: "/user/registrations", label: "My Registrations", icon: Ticket },
  { to: "/user/certificates", label: "Certificates", icon: Award },
  { to: "/user/notifications", label: "Notifications", icon: Bell },
  { to: "/user/profile", label: "Profile", icon: UserRound },
]

const organizerNav: NavItem[] = [
  { to: "/organizer", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/organizer/events", label: "My Events", icon: CalendarRange },
  { to: "/organizer/attendance", label: "Attendance", icon: QrCode },
  { to: "/organizer/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/organizer/notifications", label: "Notifications", icon: Bell },
  { to: "/organizer/send-notifications", label: "Send Notifications", icon: Megaphone },
  { to: "/organizer/profile", label: "Profile", icon: UserRound },
]

const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/organizers", label: "Organizers", icon: Megaphone },
  { to: "/admin/events", label: "Events", icon: CalendarRange },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/security", label: "Security & Logs", icon: Shield },
  { to: "/admin/notifications", label: "Send Notifications", icon: Bell },
  { to: "/admin/profile", label: "Profile", icon: UserRound },
]

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verification-pending" element={<VerificationPendingPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* User dashboard */}
        <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
          <Route element={<DashboardLayout title="Attendee" navItems={userNav} />}>
            <Route path="/user" element={<UserDashboard />} />
            <Route path="/user/browse" element={<BrowseEventsPage />} />
            <Route path="/user/events/:id" element={<EventDetailPage />} />
            <Route path="/user/registrations" element={<MyRegistrations />} />
            <Route path="/user/certificates" element={<MyCertificates />} />
            <Route path="/user/notifications" element={<NotificationsPage />} />
            <Route path="/user/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="/dashboard" element={<Navigate to="/user" replace />} />

        {/* Organizer dashboard */}
        <Route element={<ProtectedRoute allowedRoles={["ORGANIZER"]} />}>
          <Route element={<DashboardLayout title="Organizer" navItems={organizerNav} />}>
            <Route path="/organizer" element={<OrganizerDashboard />} />
            <Route path="/organizer/events" element={<OrganizerEvents />} />
            <Route path="/organizer/events/new" element={<EventFormPage />} />
            <Route path="/organizer/events/:id/edit" element={<EventFormPage />} />
            <Route path="/organizer/attendance" element={<AttendancePage />} />
            <Route path="/organizer/analytics" element={<OrganizerAnalytics />} />
            <Route path="/organizer/notifications" element={<NotificationsPage />} />
            <Route path="/organizer/send-notifications" element={<OrganizerNotifications />} />
            <Route path="/organizer/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Admin dashboard */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route element={<DashboardLayout title="Admin" navItems={adminNav} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/organizers" element={<AdminOrganizers />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/security" element={<AdminSecurity />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
