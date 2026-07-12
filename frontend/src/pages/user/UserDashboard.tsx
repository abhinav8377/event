"use client"

import useSWR from "swr"
import { Link } from "react-router-dom"
import dayjs from "dayjs"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import {
  Ticket,
  CalendarCheck,
  Award,
  Star,
  TrendingUp,
  MessageSquare,
  Bell,
  RefreshCw,
  Clock,
  MapPin,
  Zap,
  XCircle,
} from "lucide-react"
import { useAppSelector } from "@/app/store"
import { getUserDashboard, type UserDashboardData } from "@/api/userApi"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/cards/StatCard"
import { Card, Badge, Button, Loader, EmptyState } from "@/components/common/ui"

const CHART_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"]

const CATEGORY_LABELS: Record<string, string> = {
  TECH: "Technology",
  BUSINESS: "Business",
  EDUCATION: "Education",
  CULTURE: "Arts & Culture",
  SPORTS: "Sports",
  COMMUNITY: "Community",
  OTHER: "Other",
}

const ATTENDANCE_BADGE: Record<string, "success" | "warning" | "destructive" | "outline" | "default"> = {
  PRESENT: "success",
  LATE: "warning",
  ABSENT: "destructive",
  NOT_MARKED: "outline",
}

const STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "outline" | "default"> = {
  CONFIRMED: "success",
  CANCELLED: "destructive",
}

export default function UserDashboard() {
  const user = useAppSelector((s) => s.auth.user)!

  const {
    data: dashboard,
    error,
    mutate: refresh,
  } = useSWR("user-dashboard", () => getUserDashboard().then((r) => r.data))

  if (error) {
    return (
      <div>
        <PageHeader
          title={`Welcome back, ${user.name.split(" ")[0]}`}
          description="Your event activity at a glance."
          action={
            <Button size="sm" variant="outline" onClick={() => refresh()}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Retry
            </Button>
          }
        />
        <EmptyState
          icon={<TrendingUp className="size-10" aria-hidden="true" />}
          title="Failed to load dashboard"
          description="Could not fetch your data. Please try again."
        />
      </div>
    )
  }

  if (!dashboard) return <Loader />

  const { stats, recentActivity, categoryData, monthlyData, upcomingRegistered, suggestions } = dashboard

  const categoryChartData = categoryData.map((c) => ({
    name: CATEGORY_LABELS[c.name] || c.name,
    value: c.value,
  }))

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Your event activity at a glance."
        action={
          <Button size="sm" variant="outline" onClick={() => refresh()}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Sync
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Registered Events" value={stats.totalRegistered} icon={Ticket} tone="primary" />
        <StatCard label="Events Attended" value={stats.eventsAttended} icon={CalendarCheck} tone="success" />
        <StatCard label="Certificates Earned" value={stats.certificatesEarned} icon={Award} tone="warning" />
        <StatCard label="Feedback Given" value={stats.feedbackGiven} icon={MessageSquare} />
        <StatCard
          label="Avg. Rating Given"
          value={stats.avgRatingGiven > 0 ? `${stats.avgRatingGiven} / 5` : "N/A"}
          icon={Star}
          tone="warning"
        />
        <StatCard label="Unread Notifications" value={stats.unreadNotifications} icon={Bell} tone="destructive" />
        <StatCard label="Upcoming Events" value={upcomingRegistered.length} icon={Clock} />
        <StatCard label="Cancelled" value={stats.cancelledRegistrations} icon={XCircle} tone="destructive" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-x-auto lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-bold text-foreground">Recent Activity</h2>
            <Link to="/user/registrations" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No activity yet. Register for an event to get started!</p>
          ) : (
            <table className="mt-3 w-full min-w-[580px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2 font-semibold">Event</th>
                  <th className="px-5 py-2 font-semibold">Category</th>
                  <th className="px-5 py-2 font-semibold">Date</th>
                  <th className="px-5 py-2 font-semibold">Status</th>
                  <th className="px-5 py-2 font-semibold">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentActivity.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/50">
                    <td className="px-5 py-3">
                      <p className="truncate font-medium text-foreground">{r.eventTitle}</p>
                      <p className="text-xs text-muted-foreground">{r.ticketNumber}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {CATEGORY_LABELS[r.eventCategory] || r.eventCategory}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {dayjs(r.registeredAt).format("MMM D, YYYY")}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={STATUS_BADGE[r.status] || "default"}>{r.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={ATTENDANCE_BADGE[r.attendance] || "outline"}>
                        {r.attendance === "NOT_MARKED" ? "Pending" : r.attendance}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-bold text-foreground">Category Breakdown</h2>
          {categoryChartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {categoryChartData.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3">
              {categoryChartData.map((c, i) => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  {c.name} ({c.value})
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {monthlyData.length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="mb-4 font-bold text-foreground">Monthly Activity</h2>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v) => dayjs(v + "-01").format("MMM YY")}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelFormatter={(v) => dayjs(v + "-01").format("MMMM YYYY")}
                />
                <Legend />
                <Bar dataKey="registered" name="Registered" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attended" name="Attended" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {upcomingRegistered.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Your Upcoming Events</h2>
            <Link to="/user/registrations" className="text-sm font-semibold text-primary hover:underline">
              View all registrations
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingRegistered.map((event) => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="size-10 text-primary/30" />
                    </div>
                    <Badge variant="success" className="absolute left-3 top-3">
                      Registered
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate font-semibold text-foreground">{event.title}</h3>
                    <div className="mt-2 space-y-1">
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        {dayjs(event.date).format("MMM D, YYYY")}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" />
                        {event.venue || event.city || "TBA"}
                      </p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {event.category}
                      </Badge>
                      <Badge variant="accent" className="text-xs">
                        {event.mode}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {suggestions.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-foreground">Suggested For You</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((event) => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  <div className="h-24 bg-gradient-to-br from-accent/30 to-accent/5" />
                  <div className="p-4">
                    <h3 className="truncate text-sm font-semibold text-foreground">{event.title}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {dayjs(event.date).format("MMM D, YYYY")}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {event.category}
                      </Badge>
                      {event.price > 0 && (
                        <Badge variant="warning" className="text-xs">
                          ${event.price}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
