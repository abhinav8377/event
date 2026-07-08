"use client"

import useSWR from "swr"
import { Link } from "react-router-dom"
import dayjs from "dayjs"
import { Users, Megaphone, CalendarRange, Ticket, Award, TrendingUp } from "lucide-react"
import * as adminApi from "@/api/adminApi"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/cards/StatCard"
import { Card, Badge, Loader } from "@/components/common/ui"
import type { EventStatus } from "@/constants/types"

const statusVariant: Record<EventStatus, "default" | "success" | "destructive" | "outline"> = {
  DRAFT: "outline",
  PUBLISHED: "success",
  CANCELLED: "destructive",
  COMPLETED: "default",
}

export default function AdminDashboard() {
  const { data: stats } = useSWR("admin-stats", () => adminApi.getAdminStats().then((r) => r.data))
  const { data: allEvents } = useSWR("admin-events", () => adminApi.getAllEvents().then((r) => r.data))
  const { data: allUsers } = useSWR("all-users", () => adminApi.getAllUsers().then((r) => r.data))

  if (!stats || !allEvents || !allUsers) return <Loader />

  const recentEvents = [...allEvents]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 6)

  const pendingOrganizers = allUsers.filter((u) => u.role === "ORGANIZER" && !u.verified)

  return (
    <div>
      <PageHeader title="Platform overview" description="System-wide statistics and recent activity." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total users" value={stats.totalUsers} icon={Users} />
        <StatCard label="Organizers" value={stats.totalOrganizers} icon={Megaphone} />
        <StatCard label="Total events" value={stats.totalEvents} icon={CalendarRange} />
        <StatCard label="Published events" value={stats.publishedEvents} icon={TrendingUp} tone="success" />
        <StatCard label="Registrations" value={stats.totalRegistrations} icon={Ticket} tone="warning" />
        <StatCard label="Certificates issued" value={stats.certificatesIssued} icon={Award} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-x-auto lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-bold text-foreground">Recent events</h2>
            <Link to="/admin/events" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          <table className="mt-3 w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-2 font-semibold">Event</th>
                <th className="px-5 py-2 font-semibold">Organizer</th>
                <th className="px-5 py-2 font-semibold">Date</th>
                <th className="px-5 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentEvents.map((e) => (
                <tr key={e.id} className="hover:bg-muted/50">
                  <td className="px-5 py-3 font-medium text-foreground">{e.title}</td>
                  <td className="px-5 py-3 text-muted-foreground">{e.organizerName}</td>
                  <td className="px-5 py-3 text-muted-foreground">{dayjs(e.startDate).format("MMM D, YYYY")}</td>
                  <td className="px-5 py-3">
                    <Badge variant={statusVariant[e.status]}>{e.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-foreground">Pending verifications</h2>
            <Link to="/admin/organizers" className="text-sm font-semibold text-primary hover:underline">
              Review
            </Link>
          </div>
          {pendingOrganizers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No pending organizer verifications.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {pendingOrganizers.map((o) => (
                <div key={o.id} className="flex items-center gap-3 py-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                    {o.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{o.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{o.organization ?? o.email}</p>
                  </div>
                  <Badge variant="warning" className="ml-auto shrink-0">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
