"use client"

import useSWR from "swr"
import { Link } from "react-router-dom"
import dayjs from "dayjs"
import { CalendarRange, Users, UserCheck, Star, Plus, Eye } from "lucide-react"
import { useAppSelector } from "@/app/store"
import * as eventApi from "@/api/eventApi"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/cards/StatCard"
import { Card, Badge, Button, Loader, EmptyState } from "@/components/common/ui"
import type { EventStatus } from "@/constants/types"

const statusVariant: Record<EventStatus, "default" | "success" | "destructive" | "outline"> = {
  DRAFT: "outline",
  PUBLISHED: "success",
  CANCELLED: "destructive",
  COMPLETED: "default",
}

export default function OrganizerDashboard() {
  const user = useAppSelector((s) => s.auth.user)!

  const { data: myEvents } = useSWR(["organizer-events", user.id], () =>
    eventApi.getOrganizerEvents(user.id).then((r) => r.data),
  )

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

  return (
    <div>
      <PageHeader
        title={`Hello, ${user.name.split(" ")[0]}`}
        description="Here's how your events are performing."
        action={
          <Link to="/organizer/events/new">
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Create event
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total events" value={myEvents.length} icon={CalendarRange} />
        <StatCard label="Total registrations" value={totalRegistrations} icon={Users} tone="success" />
        <StatCard label="Total check-ins" value={totalAttendance} icon={UserCheck} tone="warning" />
        <StatCard label="Average rating" value={avgRating > 0 ? `${avgRating} / 5` : "—"} icon={Star} />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Upcoming events</h2>
          <Link to="/organizer/events" className="text-sm font-semibold text-primary hover:underline">
            Manage all events
          </Link>
        </div>

        {upcoming.length === 0 ? (
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
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Event</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Registrations</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {upcoming.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/50">
                    <td className="px-5 py-3">
                      <Link to={`/events/${e.id}`} className="font-semibold text-foreground hover:text-primary">
                        {e.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {dayjs(e.startDate).format("MMM D, YYYY")}
                    </td>
                    <td className="px-5 py-3 text-foreground">
                      {e.registeredCount} / {e.capacity}
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
          </Card>
        )}
      </section>
    </div>
  )
}
