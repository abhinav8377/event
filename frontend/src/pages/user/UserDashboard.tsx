"use client"

import useSWR from "swr"
import { Link } from "react-router-dom"
import dayjs from "dayjs"
import { Ticket, CalendarCheck, Award, Star } from "lucide-react"
import { useAppSelector } from "@/app/store"
import * as registrationApi from "@/api/registrationApi"
import * as certificateApi from "@/api/certificateApi"
import * as eventApi from "@/api/eventApi"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/cards/StatCard"
import { EventCard } from "@/components/cards/EventCard"
import { Card, Loader, EmptyState, Badge, Button } from "@/components/common/ui"

export default function UserDashboard() {
  const user = useAppSelector((s) => s.auth.user)!

  const { data: regs } = useSWR(["my-registrations", user.id], () =>
    registrationApi.getMyRegistrations(user.id).then((r) => r.data),
  )
  const { data: certs } = useSWR(["my-certificates", user.id], () =>
    certificateApi.getMyCertificates(user.id).then((r) => r.data),
  )
  const { data: upcoming } = useSWR("upcoming-events", () =>
    eventApi.getUpcomingEvents().then((r) => r.data),
  )

  if (!regs || !certs || !upcoming) return <Loader />

  const confirmed = regs.filter((r) => r.status === "CONFIRMED")
  const attended = regs.filter((r) => r.attendance === "PRESENT")
  const registeredEventIds = new Set(confirmed.map((r) => r.eventId))
  const upcomingRegistered = upcoming.filter((e) => registeredEventIds.has(e.id))
  const suggestions = upcoming.filter((e) => !registeredEventIds.has(e.id)).slice(0, 3)

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Here's what's happening with your events."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active registrations" value={confirmed.length} icon={Ticket} />
        <StatCard label="Events attended" value={attended.length} icon={CalendarCheck} tone="success" />
        <StatCard label="Certificates earned" value={certs.length} icon={Award} tone="warning" />
        <StatCard label="Upcoming registered" value={upcomingRegistered.length} icon={Star} />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Your upcoming events</h2>
          <Link to="/user/registrations" className="text-sm font-semibold text-primary hover:underline">
            View all registrations
          </Link>
        </div>
        {upcomingRegistered.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="size-10" aria-hidden="true" />}
            title="No upcoming events"
            description="You haven't registered for any upcoming events yet. Explore what's happening near you."
            action={
              <Link to="/events">
                <Button size="sm">Browse events</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingRegistered.map((event) => (
              <div key={event.id} className="relative">
                <EventCard event={event} />
                <Badge variant="success" className="absolute left-3 top-12">
                  Registered
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {suggestions.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-foreground">Suggested for you</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {attended.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-foreground">Recent activity</h2>
          <Card className="divide-y divide-border">
            {regs
              .slice()
              .sort((a, b) => dayjs(b.registeredAt).valueOf() - dayjs(a.registeredAt).valueOf())
              .slice(0, 5)
              .map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">Ticket {r.ticketNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Registered {dayjs(r.registeredAt).format("MMM D, YYYY")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      r.status === "CANCELLED"
                        ? "destructive"
                        : r.attendance === "PRESENT"
                          ? "success"
                          : "default"
                    }
                  >
                    {r.status === "CANCELLED" ? "Cancelled" : r.attendance === "PRESENT" ? "Attended" : "Confirmed"}
                  </Badge>
                </div>
              ))}
          </Card>
        </section>
      )}
    </div>
  )
}
