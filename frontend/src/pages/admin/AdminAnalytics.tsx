"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"
import {
  Users,
  Megaphone,
  CalendarRange,
  Ticket,
  Award,
  TrendingUp,
  DollarSign,
  BarChart3,
} from "lucide-react"
import * as adminApi from "@/api/adminApi"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Loader, EmptyState, Button } from "@/components/common/ui"
import clsx from "clsx"
import type { EventItem } from "@/constants/types"

const CHART_COLORS = ["#f59e0b", "#22c55e", "#a8a29e", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"]
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#a8a29e",
  PUBLISHED: "#22c55e",
  CANCELLED: "#ef4444",
  COMPLETED: "#3b82f6",
}
const MODE_COLORS: Record<string, string> = {
  "In person": "#f59e0b",
  Online: "#3b82f6",
  Hybrid: "#8b5cf6",
}

const CATEGORIES = ["All", "Technology", "Business", "Education", "Arts", "Sports", "Community"]

function StatCard({ icon: Icon, label, value, sub, color }: { icon: typeof Users; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {sub && <p className="text-[11px] text-muted-foreground/70">{sub}</p>}
        </div>
      </div>
    </Card>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminAnalytics() {
  const [categoryFilter, setCategoryFilter] = useState("All")

  const { data: allEvents, error, mutate } = useSWR("admin-events", () =>
    adminApi.getAllEvents().then((r) => r.data),
  )
  const { data: stats } = useSWR("admin-stats", () =>
    adminApi.getAdminStats().then((r) => r.data),
  )
  const { data: allUsers } = useSWR("all-users", () =>
    adminApi.getAllUsers().then((r) => r.data),
  )

  if (error) {
    return (
      <div>
        <PageHeader title="Analytics" description="Platform-wide insights and trends." />
        <EmptyState
          icon={<BarChart3 className="size-10" aria-hidden="true" />}
          title="Failed to load analytics"
          description="Could not fetch platform data. Please try again."
          action={<Button onClick={() => mutate()}>Retry</Button>}
        />
      </div>
    )
  }

  if (!allEvents || !stats) return <Loader />

  const filtered = categoryFilter === "All"
    ? allEvents
    : allEvents.filter((e) => e.category === categoryFilter)

  const totalRegistrations = filtered.reduce((s, e) => s + e.registeredCount, 0)
  const totalAttendance = filtered.reduce((s, e) => s + e.attendanceCount, 0)
  const totalRevenue = filtered.reduce((s, e) => s + e.price * e.registeredCount, 0)
  const avgRating =
    filtered.filter((e) => e.ratingCount > 0).reduce((s, e) => s + e.rating, 0) /
      (filtered.filter((e) => e.ratingCount > 0).length || 1)
  const publishedCount = filtered.filter((e) => e.status === "PUBLISHED").length

  const categoryCounts = filtered.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))

  const statusCounts = filtered.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1
    return acc
  }, {})
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, Events: value }))

  const topEvents = [...filtered]
    .sort((a, b) => b.registeredCount - a.registeredCount)
    .slice(0, 8)
    .map((e) => ({
      name: e.title.length > 20 ? `${e.title.slice(0, 20)}…` : e.title,
      Registrations: e.registeredCount,
      "Checked in": e.attendanceCount,
    }))

  const modeCounts = filtered.reduce<Record<string, number>>((acc, e) => {
    const mode = e.mode === "IN_PERSON" ? "In person" : e.mode === "ONLINE" ? "Online" : "Hybrid"
    acc[mode] = (acc[mode] ?? 0) + 1
    return acc
  }, {})
  const modeData = Object.entries(modeCounts).map(([name, value]) => ({ name, value }))

  const monthlyMap = new Map<string, { month: string; Events: number; Registrations: number }>()
  for (const e of filtered) {
    const d = new Date(e.startDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" })
    if (!monthlyMap.has(key)) monthlyMap.set(key, { month: label, Events: 0, Registrations: 0 })
    const entry = monthlyMap.get(key)!
    entry.Events += 1
    entry.Registrations += e.registeredCount
  }
  const monthlyData = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month))

  const priceRanges = [
    { label: "Free", min: 0, max: 0 },
    { label: "$1 – $25", min: 1, max: 25 },
    { label: "$26 – $50", min: 26, max: 50 },
    { label: "$51 – $100", min: 51, max: 100 },
    { label: "$100+", min: 101, max: Infinity },
  ]
  const priceData = priceRanges.map((r) => ({
    name: r.label,
    Events: filtered.filter((e) => e.price >= r.min && e.price <= r.max).length,
  }))

  const capacityUtil = filtered
    .filter((e) => e.registeredCount > 0)
    .sort((a, b) => (b.registeredCount / b.capacity) - (a.registeredCount / a.capacity))
    .slice(0, 8)
    .map((e) => ({
      name: e.title.length > 20 ? `${e.title.slice(0, 20)}…` : e.title,
      "Utilization %": Math.round((e.registeredCount / e.capacity) * 100),
    }))

  return (
    <div>
      <PageHeader title="Analytics" description="Platform-wide insights and trends." />

      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategoryFilter(c)}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              categoryFilter === c
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={CalendarRange}
          label="Total Events"
          value={filtered.length}
          sub={`${publishedCount} published`}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          icon={Ticket}
          label="Registrations"
          value={totalRegistrations.toLocaleString()}
          sub={`across ${filtered.length} events`}
          color="bg-success/10 text-success"
        />
        <StatCard
          icon={Users}
          label="Attendance"
          value={totalAttendance.toLocaleString()}
          sub={totalRegistrations > 0 ? `${Math.round((totalAttendance / totalRegistrations) * 100)}% check-in rate` : "no data"}
          color="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          icon={DollarSign}
          label="Est. Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          sub="from paid events"
          color="bg-warning/10 text-warning"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Megaphone}
          label="Organizers"
          value={stats.totalOrganizers}
          sub={`${allUsers?.filter((u: any) => u.role === "ORGANIZER" && !u.blocked).length ?? 0} active`}
          color="bg-purple-500/10 text-purple-500"
        />
        <StatCard
          icon={Users}
          label="Attendees"
          value={stats.totalUsers - stats.totalOrganizers}
          sub="registered users"
          color="bg-pink-500/10 text-pink-500"
        />
        <StatCard
          icon={Award}
          label="Certificates"
          value={stats.certificatesIssued}
          sub="issued to date"
          color="bg-emerald-500/10 text-emerald-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg. Rating"
          value={avgRating > 0 ? avgRating.toFixed(1) : "—"}
          sub={avgRating > 0 ? "out of 5 stars" : "no reviews yet"}
          color="bg-amber-500/10 text-amber-500"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-foreground">Top events by registrations</h2>
          <div className="scroll-x h-80 min-w-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEvents} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="Registrations" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} barSize={14} />
                <Bar dataKey="Checked in" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-bold text-foreground">Events by category</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-bold text-foreground">Events by status</h2>
          <div className="scroll-x h-72 min-w-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} />
                <Bar dataKey="Events" radius={[4, 4, 0, 0]} barSize={36}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-bold text-foreground">Event modes</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={modeData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                  {modeData.map((entry) => (
                    <Cell key={entry.name} fill={MODE_COLORS[entry.name] || "#a8a29e"} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {monthlyData.length > 1 && (
          <Card className="p-6 lg:col-span-2">
            <h2 className="mb-4 font-bold text-foreground">Monthly trend</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 4, right: 16, bottom: 4, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-primary)", strokeDasharray: "3 3" }} />
                  <Legend iconType="circle" iconSize={8} />
                  <Line type="monotone" dataKey="Events" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Registrations" stroke={CHART_COLORS[4]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="mb-4 font-bold text-foreground">Price distribution</h2>
          <div className="scroll-x h-72 min-w-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} />
                <Bar dataKey="Events" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-bold text-foreground">Capacity utilization</h2>
          <div className="scroll-x h-72 min-w-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityUtil} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                <Tooltip content={<ChartTooltip />} formatter={(v: number) => `${v}%`} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} />
                <Bar dataKey="Utilization %" fill={CHART_COLORS[5]} radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
