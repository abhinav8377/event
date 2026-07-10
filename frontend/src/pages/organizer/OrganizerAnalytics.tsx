"use client"

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
} from "recharts"
import { Star } from "lucide-react"
import { useAppSelector } from "@/app/store"
import * as eventApi from "@/api/eventApi"
import * as feedbackApi from "@/api/feedbackApi"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Loader, EmptyState, Button } from "@/components/common/ui"
import useSWRImmutable from "swr/immutable"

const CHART_COLORS = ["#f59e0b", "#22c55e", "#78716c", "#ef4444"]

export default function OrganizerAnalytics() {
  const user = useAppSelector((s) => s.auth.user)!

  const { data: myEvents, error: myEventsError, mutate } = useSWR(["organizer-events", user.id], () =>
    eventApi.getOrganizerEvents(user.id).then((r) => r.data),
  )

  const ratedEventIds = (myEvents ?? []).filter((e) => e.ratingCount > 0).map((e) => e.id)
  const { data: reviews } = useSWRImmutable(
    myEvents ? ["organizer-feedback", user.id] : null,
    async () => {
      const all = await Promise.all(ratedEventIds.map((id) => feedbackApi.getEventFeedback(id).then((r) => r.data)))
      return all.flat()
    },
  )

  if (myEventsError) {
    return (
      <div>
        <PageHeader title="Analytics" description="Insights across your events." />
        <EmptyState
          icon={<Star className="size-10" aria-hidden="true" />}
          title="Failed to load analytics"
          description={myEventsError.message || "Could not fetch your events. Please try again."}
          action={<Button onClick={() => mutate()}>Retry</Button>}
        />
      </div>
    )
  }

  if (!myEvents) return <Loader />

  if (myEvents.length === 0) {
    return (
      <div>
        <PageHeader title="Analytics" description="Insights across your events." />
        <EmptyState title="No data yet" description="Create and publish events to see analytics here." />
      </div>
    )
  }

  const regData = myEvents.map((e) => ({
    name: e.title.length > 18 ? `${e.title.slice(0, 18)}…` : e.title,
    Registrations: e.registeredCount,
    "Checked in": e.attendanceCount,
  }))

  const categoryCounts = myEvents.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))

  const eventTitleById = new Map(myEvents.map((e) => [e.id, e.title]))

  return (
    <div>
      <PageHeader title="Analytics" description="Registrations, attendance, and feedback across your events." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 font-bold text-foreground">Registrations vs. check-ins</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Registrations" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Checked in" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-bold text-foreground">Events by category</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={4}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="mb-4 font-bold text-foreground">Recent feedback</h2>
        {!reviews || reviews.length === 0 ? (
          <EmptyState
            title="No feedback yet"
            description="Attendee reviews will appear here after your events complete."
          />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {reviews.slice(0, 8).map((f) => (
              <div key={f.id} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{f.userName}</span>
                  <span className="flex items-center gap-0.5" aria-label={`${f.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={n <= f.rating ? "size-3.5 fill-warning text-warning" : "size-3.5 text-border"}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                  <span className="text-xs text-muted-foreground">{eventTitleById.get(f.eventId)}</span>
                </div>
                <p className="text-sm text-muted-foreground text-pretty">{f.review}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
