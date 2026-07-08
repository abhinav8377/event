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
import * as adminApi from "@/api/adminApi"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Loader } from "@/components/common/ui"

const CHART_COLORS = ["#f59e0b", "#22c55e", "#a8a29e", "#ef4444", "#fbbf24", "#78716c", "#57534e"]

export default function AdminAnalytics() {
  const { data: allEvents } = useSWR("admin-events", () => adminApi.getAllEvents().then((r) => r.data))

  if (!allEvents) return <Loader />

  const categoryCounts = allEvents.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))

  const statusCounts = allEvents.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1
    return acc
  }, {})
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, Events: value }))

  const topEvents = [...allEvents]
    .sort((a, b) => b.registeredCount - a.registeredCount)
    .slice(0, 6)
    .map((e) => ({
      name: e.title.length > 18 ? `${e.title.slice(0, 18)}…` : e.title,
      Registrations: e.registeredCount,
    }))

  return (
    <div>
      <PageHeader title="Analytics" description="Platform-wide trends across events and registrations." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-foreground">Top events by registrations</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topEvents} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="Registrations" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
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

        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 font-bold text-foreground">Events by status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Events" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
