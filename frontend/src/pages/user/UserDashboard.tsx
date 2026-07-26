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
  XCircle,
  ArrowRight,
  PieChart as PieChartIcon,
} from "lucide-react"
import { useAppSelector } from "@/app/store"
import { getUserDashboard } from "@/api/userApi"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/cards/StatCard"
import { Card, Badge, Button, Loader, EmptyState } from "@/components/common/ui"
import { getGreeting } from "@/utils/greeting"
import { CHART_COLORS } from "@/constants/chartColors"

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
          eyebrow="your dashboard"
          title={`${getGreeting()}, ${user.name.split(" ")[0]}.`}
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

  const { stats, recentActivity, categoryData, monthlyData } = dashboard

  const categoryChartData = categoryData.map((c) => ({
    name: CATEGORY_LABELS[c.name] || c.name,
    value: c.value,
  }))

  return (
    <div>
      <PageHeader
        eyebrow="your dashboard"
        title={`${getGreeting()}, ${user.name.split(" ")[0]}.`}
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
        <StatCard label="Cancelled" value={stats.cancelledRegistrations} icon={XCircle} tone="destructive" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-x-auto lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-bold text-foreground">Recent Activity</h2>
            <Link to="/user/registrations" className="flex items-center gap-1 font-mono text-xs text-primary hover:underline">
              view all
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                icon={<Ticket className="size-9" aria-hidden="true" />}
                title="No activity yet"
                description="Register for an event and it'll show up here."
                action={
                  <Link to="/user/browse">
                    <Button size="sm">
                      Browse events
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  </Link>
                }
              />
            </div>
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
                {recentActivity.slice(0, 4).map((r) => (
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
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <PieChartIcon className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No data yet.</p>
            </div>
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
          <div className="w-full overflow-x-auto">
            <div className="h-[260px] min-w-[460px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(v) => dayjs(v + "-01").format("MMM YY")}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    width={44}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 600 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
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
          </div>
        </Card>
      )}

    </div>
  )
}
