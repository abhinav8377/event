import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
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
  CreditCard,
  ClipboardList,
  MessagesSquare,
} from "lucide-react"
import PublicLayout from "@/layouts/PublicLayout"
import DashboardLayout, { type NavItem } from "@/layouts/DashboardLayout"
import ProtectedRoute from "@/routes/ProtectedRoute"
import { Toaster } from "@/components/common/Toaster"
import { Loader } from "@/components/common/ui"

const LandingPage = lazy(() => import("@/pages/public/LandingPage"))
const EventDetailPage = lazy(() => import("@/pages/public/EventDetailPage"))
const AboutPage = lazy(() => import("@/pages/public/AboutPage"))
const ContactPage = lazy(() => import("@/pages/public/ContactPage"))
const NotFoundPage = lazy(() => import("@/pages/public/NotFoundPage"))
const ForbiddenPage = lazy(() => import("@/pages/public/ForbiddenPage"))
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"))
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"))
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"))
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"))
const VerificationPendingPage = lazy(() => import("@/pages/auth/VerificationPendingPage"))
const SSOCallbackPage = lazy(() => import("@/pages/auth/SSOCallbackPage"))
const SSOCompletePage = lazy(() => import("@/pages/auth/SSOCompletePage"))

const UserDashboard = lazy(() => import("@/pages/user/UserDashboard"))
const MyRegistrations = lazy(() => import("@/pages/user/MyRegistrations"))
const MyCertificates = lazy(() => import("@/pages/user/MyCertificates"))
const BrowseEventsPage = lazy(() => import("@/pages/user/BrowseEventsPage"))

const OrganizerDashboard = lazy(() => import("@/pages/organizer/OrganizerDashboard"))
const OrganizerEvents = lazy(() => import("@/pages/organizer/OrganizerEvents"))
const EventFormPage = lazy(() => import("@/pages/organizer/EventFormPage"))
const AttendancePage = lazy(() => import("@/pages/organizer/AttendancePage"))
const OrganizerAnalytics = lazy(() => import("@/pages/organizer/OrganizerAnalytics"))
const OrganizerNotifications = lazy(() => import("@/pages/organizer/OrganizerNotifications"))
const OrganizerRegistrations = lazy(() => import("@/pages/organizer/OrganizerRegistrations"))
const PaymentIntegrationPage = lazy(() => import("@/pages/organizer/PaymentIntegrationPage"))
const OrganizerCommunities = lazy(() => import("@/pages/organizer/OrganizerCommunities"))
const PaymentSuccessPage = lazy(() => import("@/pages/user/PaymentSuccessPage"))
const UserCommunities = lazy(() => import("@/pages/user/UserCommunities"))

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"))
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"))
const AdminOrganizers = lazy(() => import("@/pages/admin/AdminOrganizers"))
const AdminEvents = lazy(() => import("@/pages/admin/AdminEvents"))
const AdminAnalytics = lazy(() => import("@/pages/admin/AdminAnalytics"))
const AdminNotifications = lazy(() => import("@/pages/admin/AdminNotifications"))
const AdminSecurity = lazy(() => import("@/pages/admin/AdminSecurity"))

const NotificationsPage = lazy(() => import("@/pages/shared/NotificationsPage"))
const ProfilePage = lazy(() => import("@/pages/shared/ProfilePage"))

const userNav: NavItem[] = [
  { to: "/user", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/user/browse", label: "Browse Events", icon: Search },
  { to: "/user/registrations", label: "My Registrations", icon: Ticket },
  { to: "/user/certificates", label: "Certificates", icon: Award },
  { to: "/user/communities", label: "Communities", icon: MessagesSquare },
  { to: "/user/notifications", label: "Notifications", icon: Bell },
  { to: "/user/profile", label: "Profile", icon: UserRound },
]

const organizerNav: NavItem[] = [
  { to: "/organizer", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/organizer/events", label: "My Events", icon: CalendarRange },
  { to: "/organizer/registrations", label: "Registrations", icon: ClipboardList },
  { to: "/organizer/attendance", label: "Attendance", icon: QrCode },
  { to: "/organizer/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/organizer/payment-integration", label: "Payment Setup", icon: CreditCard },
  { to: "/organizer/notifications", label: "Notifications", icon: Bell },
  { to: "/organizer/send-notifications", label: "Send Notifications", icon: Megaphone },
  { to: "/organizer/communities", label: "Community", icon: MessagesSquare },
  { to: "/organizer/profile", label: "Profile", icon: UserRound },
]

const clerkEnabled = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

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
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Suspense fallback={<Loader />}><LandingPage /></Suspense>} />
          <Route path="/events/:id" element={<Suspense fallback={<Loader />}><EventDetailPage /></Suspense>} />
          <Route path="/about" element={<Suspense fallback={<Loader />}><AboutPage /></Suspense>} />
          <Route path="/contact" element={<Suspense fallback={<Loader />}><ContactPage /></Suspense>} />
        </Route>
        <Route path="/login" element={<Suspense fallback={<Loader />}><LoginPage /></Suspense>} />
        <Route path="/register" element={<Suspense fallback={<Loader />}><RegisterPage /></Suspense>} />
        <Route path="/forgot-password" element={<Suspense fallback={<Loader />}><ForgotPasswordPage /></Suspense>} />
        <Route path="/reset-password" element={<Suspense fallback={<Loader />}><ResetPasswordPage /></Suspense>} />
        <Route path="/verification-pending" element={<Suspense fallback={<Loader />}><VerificationPendingPage /></Suspense>} />
        <Route path="/403" element={<Suspense fallback={<Loader />}><ForbiddenPage /></Suspense>} />
        {clerkEnabled && (
          <>
            <Route path="/sso-callback" element={<Suspense fallback={<Loader />}><SSOCallbackPage /></Suspense>} />
            <Route path="/sso-complete" element={<Suspense fallback={<Loader />}><SSOCompletePage /></Suspense>} />
          </>
        )}

        <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
          <Route element={<DashboardLayout title="Attendee" navItems={userNav} />}>
            <Route path="/user" element={<Suspense fallback={<Loader />}><UserDashboard /></Suspense>} />
            <Route path="/user/browse" element={<Suspense fallback={<Loader />}><BrowseEventsPage /></Suspense>} />
            <Route path="/user/events/:id" element={<Suspense fallback={<Loader />}><EventDetailPage /></Suspense>} />
            <Route path="/user/registrations" element={<Suspense fallback={<Loader />}><MyRegistrations /></Suspense>} />
            <Route path="/user/certificates" element={<Suspense fallback={<Loader />}><MyCertificates /></Suspense>} />
            <Route path="/user/communities" element={<Suspense fallback={<Loader />}><UserCommunities /></Suspense>} />
            <Route path="/user/notifications" element={<Suspense fallback={<Loader />}><NotificationsPage /></Suspense>} />
            <Route path="/user/profile" element={<Suspense fallback={<Loader />}><ProfilePage /></Suspense>} />
          </Route>
        </Route>
        <Route path="/payment-success" element={<ProtectedRoute allowedRoles={["USER"]} />}>
          <Route element={<DashboardLayout title="Attendee" navItems={userNav} />}>
            <Route index element={<Suspense fallback={<Loader />}><PaymentSuccessPage /></Suspense>} />
          </Route>
        </Route>
        <Route path="/dashboard" element={<Navigate to="/user" replace />} />

        <Route element={<ProtectedRoute allowedRoles={["ORGANIZER"]} />}>
          <Route element={<DashboardLayout title="Organizer" navItems={organizerNav} />}>
            <Route path="/organizer" element={<Suspense fallback={<Loader />}><OrganizerDashboard /></Suspense>} />
            <Route path="/organizer/events" element={<Suspense fallback={<Loader />}><OrganizerEvents /></Suspense>} />
            <Route path="/organizer/events/new" element={<Suspense fallback={<Loader />}><EventFormPage /></Suspense>} />
            <Route path="/organizer/events/:id/edit" element={<Suspense fallback={<Loader />}><EventFormPage /></Suspense>} />
            <Route path="/organizer/registrations" element={<Suspense fallback={<Loader />}><OrganizerRegistrations /></Suspense>} />
            <Route path="/organizer/attendance" element={<Suspense fallback={<Loader />}><AttendancePage /></Suspense>} />
            <Route path="/organizer/analytics" element={<Suspense fallback={<Loader />}><OrganizerAnalytics /></Suspense>} />
            <Route path="/organizer/payment-integration" element={<Suspense fallback={<Loader />}><PaymentIntegrationPage /></Suspense>} />
            <Route path="/organizer/notifications" element={<Suspense fallback={<Loader />}><NotificationsPage /></Suspense>} />
            <Route path="/organizer/send-notifications" element={<Suspense fallback={<Loader />}><OrganizerNotifications /></Suspense>} />
            <Route path="/organizer/communities" element={<Suspense fallback={<Loader />}><OrganizerCommunities /></Suspense>} />
            <Route path="/organizer/profile" element={<Suspense fallback={<Loader />}><ProfilePage /></Suspense>} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route element={<DashboardLayout title="Admin" navItems={adminNav} />}>
            <Route path="/admin" element={<Suspense fallback={<Loader />}><AdminDashboard /></Suspense>} />
            <Route path="/admin/users" element={<Suspense fallback={<Loader />}><AdminUsers /></Suspense>} />
            <Route path="/admin/organizers" element={<Suspense fallback={<Loader />}><AdminOrganizers /></Suspense>} />
            <Route path="/admin/events" element={<Suspense fallback={<Loader />}><AdminEvents /></Suspense>} />
            <Route path="/admin/analytics" element={<Suspense fallback={<Loader />}><AdminAnalytics /></Suspense>} />
            <Route path="/admin/security" element={<Suspense fallback={<Loader />}><AdminSecurity /></Suspense>} />
            <Route path="/admin/notifications" element={<Suspense fallback={<Loader />}><AdminNotifications /></Suspense>} />
            <Route path="/admin/profile" element={<Suspense fallback={<Loader />}><ProfilePage /></Suspense>} />
          </Route>
        </Route>
        <Route path="*" element={<Suspense fallback={<Loader />}><NotFoundPage /></Suspense>} />
      </Routes>
    </BrowserRouter>
  )
}
