"use client"

import { useState, useCallback, Fragment } from "react"
import useSWR from "swr"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import {
  Shield,
  ShieldAlert,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
  Clock,
  Globe,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Server,
  ArrowUpDown,
  Eye,
} from "lucide-react"
import * as adminApi from "@/api/adminApi"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Badge, Button, Input, Select, Loader, EmptyState } from "@/components/common/ui"
import type { RequestLog, LogStats } from "@/constants/types"
import clsx from "clsx"

dayjs.extend(relativeTime)

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  PUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  PATCH: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
}

function getStatusStyle(code: number) {
  if (code < 200) return { bg: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400", icon: Info, label: "Informational" }
  if (code < 300) return { bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", icon: CheckCircle, label: "OK" }
  if (code < 400) return { bg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400", icon: ArrowUpDown, label: "Redirect" }
  if (code < 500) return { bg: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", icon: XCircle, label: "Client Error" }
  return { bg: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400", icon: Server, label: "Server Error" }
}

function getStatusGroupStyle(group: string) {
  switch (group) {
    case "informational": return { color: "text-sky-500", bg: "bg-sky-500", label: "Informational", icon: Info }
    case "success": return { color: "text-emerald-500", bg: "bg-emerald-500", label: "Success", icon: CheckCircle }
    case "redirect": return { color: "text-yellow-500", bg: "bg-yellow-500", label: "Redirect", icon: ArrowUpDown }
    case "clientError": return { color: "text-red-500", bg: "bg-red-500", label: "Client Error", icon: XCircle }
    case "serverError": return { color: "text-orange-500", bg: "bg-orange-500", label: "Server Error", icon: Server }
    default: return { color: "text-muted-foreground", bg: "bg-secondary", label: group, icon: AlertTriangle }
  }
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function extractEndpoint(url: string) {
  return url.replace(/^\/api\//, "/")
}

export default function AdminSecurity() {
  const [method, setMethod] = useState("")
  const [statusGroup, setStatusGroup] = useState("")
  const [statusSearch, setStatusSearch] = useState("")
  const [urlSearch, setUrlSearch] = useState("")
  const [ipSearch, setIpSearch] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [page, setPage] = useState(1)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [adminRouteFilter, setAdminRouteFilter] = useState<"all" | "true" | "false">("all")

  const buildParams = useCallback(() => {
    const params: Record<string, any> = { page, limit: 30 }
    if (method) params.method = method
    if (statusGroup) params.statusGroup = statusGroup
    if (statusSearch) params.statusCode = Number(statusSearch)
    if (urlSearch) params.url = urlSearch
    if (ipSearch) params.ip = ipSearch
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (adminRouteFilter !== "all") params.adminRoute = adminRouteFilter
    return params
  }, [page, method, statusGroup, statusSearch, urlSearch, ipSearch, startDate, endDate, adminRouteFilter])

  const { data: logsData, mutate: mutateLogs, isLoading: logsLoading } = useSWR(
    ["admin-logs", buildParams()],
    ([, params]) => adminApi.getRequestLogs(params).then((r) => r.data),
    { refreshInterval: 10000 },
  )

  const { data: stats, mutate: mutateStats } = useSWR(
    "admin-log-stats",
    () => adminApi.getLogStats().then((r) => r.data),
    { refreshInterval: 15000 },
  )

  const clearFilters = () => {
    setMethod("")
    setStatusGroup("")
    setStatusSearch("")
    setUrlSearch("")
    setIpSearch("")
    setStartDate("")
    setEndDate("")
    setAdminRouteFilter("all")
    setPage(1)
  }

  const hasFilters = method || statusGroup || statusSearch || urlSearch || ipSearch || startDate || endDate || adminRouteFilter !== "all"

  const logs = logsData?.logs || []
  const pagination = logsData?.pagination

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Security & Monitoring"
        description="Real-time HTTP request logging and activity monitoring across the platform."
        action={
          <Button variant="outline" size="sm" onClick={() => { mutateLogs(); mutateStats() }}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {stats && <StatsBar stats={stats} />}

      <Card className="mb-6 overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Filter className="size-4" aria-hidden="true" />
            Filters & Search
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-xs">
                Clear all
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="url-search"
              placeholder="Search endpoint..."
              className="pl-9"
              value={urlSearch}
              onChange={(e) => { setUrlSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="ip-search"
              placeholder="Search IP address..."
              className="pl-9"
              value={ipSearch}
              onChange={(e) => { setIpSearch(e.target.value); setPage(1) }}
            />
          </div>
          <Select
            id="method-filter"
            value={method}
            onChange={(e) => { setMethod(e.target.value); setPage(1) }}
          >
            <option value="">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </Select>
          <Select
            id="status-group-filter"
            value={statusGroup}
            onChange={(e) => { setStatusGroup(e.target.value); setPage(1) }}
          >
            <option value="">All Status Groups</option>
            <option value="informational">1xx Informational</option>
            <option value="success">2xx Success</option>
            <option value="redirect">3xx Redirect</option>
            <option value="clientError">4xx Client Error</option>
            <option value="serverError">5xx Server Error</option>
          </Select>
          <Input
            id="status-code-search"
            type="number"
            placeholder="Exact status code..."
            value={statusSearch}
            onChange={(e) => { setStatusSearch(e.target.value); setPage(1) }}
          />
          <Select
            id="admin-route-filter"
            value={adminRouteFilter}
            onChange={(e) => { setAdminRouteFilter(e.target.value as "all" | "true" | "false"); setPage(1) }}
          >
            <option value="all">All Requests</option>
            <option value="true">Admin Route Access</option>
            <option value="false">Non-Admin Routes</option>
          </Select>
          <Input
            id="start-date"
            type="date"
            label="From"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
          />
          <Input
            id="end-date"
            type="date"
            label="To"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
          />
        </div>
      </Card>

      {logsLoading && logs.length === 0 ? (
        <Loader label="Loading logs..." />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<Shield className="size-10" aria-hidden="true" />}
          title="No logs found"
          description="No HTTP requests match your current filters. Try adjusting the criteria."
        />
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Timestamp</th>
                    <th className="px-4 py-3 font-semibold">Method</th>
                    <th className="px-4 py-3 font-semibold">Endpoint</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Duration</th>
                    <th className="px-4 py-3 font-semibold">IP Address</th>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 text-right font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log: RequestLog) => {
                    const status = getStatusStyle(log.statusCode)
                    const StatusIcon = status.icon
                    const isExpanded = expandedLog === log._id
                    return (
                      <Fragment key={log._id}>
                      <tr className={clsx("transition-colors hover:bg-muted/50", isExpanded && "bg-muted/30")}>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{dayjs(log.createdAt).format("MMM D, HH:mm:ss")}</span>
                            <span>{dayjs(log.createdAt).fromNow()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx("inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-bold", METHOD_COLORS[log.method] || "bg-secondary text-muted-foreground")}>
                            {log.method}
                          </span>
                        </td>
                        <td className="max-w-[280px] truncate px-4 py-3 font-mono text-xs text-foreground" title={log.url}>
                          {extractEndpoint(log.url)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold", status.bg)}>
                            <StatusIcon className="size-3" aria-hidden="true" />
                            {log.statusCode}
                          </span>
                          {log.isAdminRoute && (
                            <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-mono text-[10px] font-bold text-red-700 dark:bg-red-900/40 dark:text-red-400">
                              <ShieldAlert className="size-2.5" />
                              ADMIN
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={clsx(
                            "font-mono text-xs font-medium",
                            log.duration > 1000 ? "text-orange-500" : log.duration > 500 ? "text-yellow-500" : "text-emerald-500",
                          )}>
                            {formatDuration(log.duration)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                          {log.ip || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {log.userName ? (
                            <div className="flex items-center gap-2">
                              <span className="flex size-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                                {log.userName.charAt(0)}
                              </span>
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-foreground">{log.userName}</span>
                                <span className="text-[10px] text-muted-foreground">{log.userRole}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Anonymous</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedLog(isExpanded ? null : log._id)}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${log._id}-details`}>
                          <td colSpan={8} className="border-t border-border bg-muted/20 px-5 py-4">
                            <div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                              <div>
                                <span className="font-semibold text-muted-foreground">Full URL</span>
                                <p className="mt-0.5 break-all font-mono text-foreground">{log.url}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-muted-foreground">User Agent</span>
                                <p className="mt-0.5 break-all text-foreground">{log.userAgent || "N/A"}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-muted-foreground">Response Size</span>
                                <p className="mt-0.5 text-foreground">{log.contentLength ? `${(log.contentLength / 1024).toFixed(1)} KB` : "N/A"}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-muted-foreground">Status Category</span>
                                <p className="mt-0.5 text-foreground">{getStatusStyle(log.statusCode).label}</p>
                              </div>
                              {log.isAdminRoute && (
                                <div className="col-span-full mt-1 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20">
                                  <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400">
                                    <ShieldAlert className="size-4" />
                                    Privilege Escalation Attempt — {log.userRole} "{log.userName}" accessed admin resource
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {pagination && pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                  Prev
                </Button>
                <span className="px-3 font-mono text-xs text-muted-foreground">
                  {pagination.page} / {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatsBar({ stats }: { stats: LogStats }) {
  const statusColors: Record<string, { color: string; bg: string; icon: typeof Info }> = {
    informational: { color: "text-sky-500", bg: "bg-sky-500/10", icon: Info },
    success: { color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle },
    redirect: { color: "text-yellow-500", bg: "bg-yellow-500/10", icon: ArrowUpDown },
    clientError: { color: "text-red-500", bg: "bg-red-500/10", icon: XCircle },
    serverError: { color: "text-orange-500", bg: "bg-orange-500/10", icon: Server },
  }

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Requests</p>
            <p className="text-xl font-bold text-foreground">{stats.totalLogs.toLocaleString()}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last 24 Hours</p>
            <p className="text-xl font-bold text-foreground">{stats.last24h.toLocaleString()}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Zap className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Hour</p>
            <p className="text-xl font-bold text-foreground">{stats.last1h.toLocaleString()}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Users (24h)</p>
            <p className="text-xl font-bold text-foreground">{stats.activeUsers.length}</p>
          </div>
        </div>
      </Card>

      <Card className="col-span-full p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Status Distribution (24h)</h3>
        <div className="flex flex-wrap gap-3">
          {stats.statusBreakdown.map((s) => {
            const style = statusColors[s.group] || statusColors.informational
            const Icon = style.icon
            return (
              <div key={s.group} className={clsx("flex items-center gap-2 rounded-lg px-3 py-2", style.bg)}>
                <Icon className={clsx("size-4", style.color)} />
                <span className="text-xs font-medium text-foreground">{s.count.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">{getStatusGroupStyle(s.group).label}</span>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="col-span-full p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Top Endpoints (24h)</h3>
        <div className="flex flex-wrap gap-2">
          {stats.topEndpoints.map((e) => (
            <div
              key={e.url}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5"
              title={`${e.count} requests | avg ${e.avgDuration}ms`}
            >
              <span className="font-mono text-xs text-foreground">{extractEndpoint(e.url)}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                {e.count}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {stats.methodBreakdown.length > 0 && (
        <Card className="col-span-full p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">HTTP Methods (24h)</h3>
          <div className="flex flex-wrap gap-3">
            {stats.methodBreakdown.map((m) => (
              <div key={m.method} className={clsx("flex items-center gap-2 rounded-lg px-3 py-2", METHOD_COLORS[m.method])}>
                <span className="font-mono text-xs font-bold">{m.method}</span>
                <span className="text-xs font-medium">{m.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
