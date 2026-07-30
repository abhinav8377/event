"use client"

import useSWR from "swr"
import { Link } from "react-router-dom"
import dayjs from "dayjs"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import {
  CalendarRange,
  Users,
  UserCheck,
  Star,
  Plus,
  Eye,
  RefreshCw,
  ArrowRight,
  PieChart as PieChartIcon,
} from "lucide-react"
import { useAppSelector } from "@/app/store"
import * as eventApi from "@/api/eventApi"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/cards/StatCard"
import { Card, Badge, Button, Loader, EmptyState } from "@/components/common/ui"
import type { EventStatus } from "@/constants/types"
import { getGreeting } from "@/utils/greeting"
import { CHART_COLORS } from "@/constants/chartColors"

const statusVariant: Record<EventStatus, "default" | "success" | "destructive" | "outline"> = {
  DRAFT: "outline",
  PUBLISHED: "success",
  CANCELLED: "destructive",
  COMPLETED: "default",
}

export default function OrganizerDashboard() {
  const user = useAppSelector((s) => s.auth.user)!

  const { data: myEvents, error: myEventsError, mutate } = useSWR(["organizer-events", user.id], () =>
    eventApi.getOrganizerEvents(user.id).then((r) => r.data),
  )

  if (myEventsError) {
    return (
      <div>
        <PageHeader
          eyebrow="organizer dashboard"
          title={`${getGreeting()}, ${user.name.split(" ")[0]}.`}
          description="Here's how your events are performing."
        />
        <EmptyState
          icon={<CalendarRange className="size-10" aria-hidden="true" />}
          title="Failed to load dashboard"
          description={myEventsError.message || "Could not fetch your events. Please try again."}
          action={<Button onClick={() => mutate()}>Retry</Button>}
        />
      </div>
    )
  }

  if (!myEvents) return <Loader />

  const published = myEvents.filter((e) => e.status === "PUBLISHED")
  const totalRegistrations = myEvents.reduce((sum, e) => sum + e.registeredCount, 0)
  const totalAttendance = myEvents.reduce((sum, e) => sum + e.attendanceCount, 0)
  const rated = myEvents.filter((e) => e.ratingCount > 0)
  const avgRating =
    rated.length > 0
      ? Math.round((rated.reduce((s, e) => s + e.rating, 0) / rated.length) * 10) / 10
      : 0

  const upcoming = published
    .filter((e) => new Date(e.startDate).getTime() > Date.now())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  const categoryData = Object.entries(
    myEvents.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))

  return (
    <div>
      <PageHeader
        eyebrow="organizer dashboard"
        title={`${getGreeting()}, ${user.name.split(" ")[0]}.`}
        description="Here's how your events are performing."
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => mutate()}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Sync
            </Button>
            <Link to="/organizer/events/new">
              <Button>
                <Plus className="size-4" aria-hidden="true" />
                Create event
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total events" value={myEvents.length} icon={CalendarRange} />
        <StatCard label="Total registrations" value={totalRegistrations} icon={Users} tone="success" />
        <StatCard label="Total check-ins" value={totalAttendance} icon={UserCheck} tone="warning" />
        <StatCard label="Average rating" value={avgRating > 0 ? `${avgRating} / 5` : "—"} icon={Star} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-x-auto lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-bold text-foreground">Upcoming events</h2>
            <Link
              to="/organizer/events"
              className="group flex items-center gap-1 font-mono text-xs text-primary hover:underline"
            >
              manage all
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                icon={<CalendarRange className="size-10" aria-hidden="true" />}
                title="No upcoming events"
                description="Create and publish an event to start accepting registrations."
                action={
                  <Link to="/organizer/events/new">
                    <Button size="sm">Create event</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <table className="mt-3 w-full min-w-145 text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2 font-semibold">Event</th>
                  <th className="px-5 py-2 font-semibold">Date</th>
                  <th className="px-5 py-2 font-semibold">Registrations</th>
                  <th className="px-5 py-2 font-semibold">Status</th>
                  <th className="px-5 py-2 font-semibold">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {upcoming.map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-5 py-3">
                      <span className="font-semibold text-foreground hover:text-primary">
                        {e.title}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {dayjs(e.startDate).format("MMM D, YYYY")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-foreground">
                          {e.registeredCount}/{e.capacity}
                        </span>
                        <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full rounded-full bg-primary"
                            style={{
                              width: `${e.capacity > 0 ? Math.min(100, (e.registeredCount / e.capacity) * 100) : 0}%`,
                            }}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariant[e.status]}>{e.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Eye className="size-4" aria-hidden="true" />
                        {e.views.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-bold text-foreground">Category Breakdown</h2>
          {categoryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <PieChartIcon className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No data yet.</p>
            </div>
          ) : (
            <div className="h-55">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, i) => (
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
          {categoryData.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3">
              {categoryData.map((c, i) => (
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
    </div>
  )
}
