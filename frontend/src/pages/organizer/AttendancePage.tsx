"use client"

import { useState } from "react"
import useSWR from "swr"
import dayjs from "dayjs"
import { QrCode, UserCheck, CheckCircle2, XCircle, Camera, Keyboard } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/store"
import * as eventApi from "@/api/eventApi"
import * as attendanceApi from "@/api/attendanceApi"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Button, Input, Select, Badge, Loader, EmptyState } from "@/components/common/ui"
import { QrScanner } from "@/components/organizer/QrScanner"
import clsx from "clsx"
import type { AttendanceStatus } from "@/constants/types"

const attendanceBadge: Record<AttendanceStatus, { label: string; variant: "success" | "warning" | "destructive" | "outline" }> = {
  PRESENT: { label: "Present", variant: "success" },
  LATE: { label: "Late", variant: "warning" },
  ABSENT: { label: "Absent", variant: "destructive" },
  NOT_MARKED: { label: "Not marked", variant: "outline" },
}

export default function AttendancePage() {
  const user = useAppSelector((s) => s.auth.user)!
  const dispatch = useAppDispatch()
  const [selectedEventId, setSelectedEventId] = useState("")
  const [code, setCode] = useState("")
  const [lastResult, setLastResult] = useState<{ ok: boolean; message: string; name?: string } | null>(null)
  const [checking, setChecking] = useState(false)
  const [mode, setMode] = useState<"scan" | "manual">("scan")

  const { data: myEvents, error: myEventsError } = useSWR(["organizer-events", user.id], () =>
    eventApi.getOrganizerEvents(user.id).then((r) => r.data),
  )
  const eventId = selectedEventId || myEvents?.find((e) => e.status === "PUBLISHED")?.id || ""
  const { data: attendance, mutate } = useSWR(eventId ? ["attendance", eventId] : null, () =>
    attendanceApi.getEventAttendance(eventId).then((r) => r.data),
  )

  if (myEventsError) {
    return (
      <div>
        <PageHeader title="Attendance" description="Scan or enter ticket codes to check attendees in." />
        <EmptyState
          icon={<QrCode className="size-10" aria-hidden="true" />}
          title="Failed to load events"
          description={myEventsError.message || "Could not fetch your events. Please try again."}
        />
      </div>
    )
  }

  if (!myEvents) return <Loader />

  const verify = async (value: string) => {
    if (!value.trim() || checking) return
    setChecking(true)
    try {
      const res = await attendanceApi.verifyAttendance(value)
      setLastResult({ ok: true, message: res.message })
      dispatch(pushToast({ type: "success", message: res.message }))
      setCode("")
      mutate()
    } catch (e) {
      const message = (e as Error).message
      setLastResult({ ok: false, message })
      dispatch(pushToast({ type: "error", message }))
    } finally {
      setChecking(false)
    }
  }

  const checkIn = () => verify(code)

  const present = (attendance ?? []).filter(
    (r: any) => r.status === "PRESENT" || r.status === "LATE",
  ).length

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Scan or enter ticket codes to check attendees in. Certificates are issued automatically."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-foreground">
            <QrCode className="size-5 text-primary" aria-hidden="true" />
            Check-in scanner
          </h2>

          <div role="tablist" aria-label="Check-in method" className="mb-4 grid grid-cols-2 gap-1 rounded-full border border-border bg-muted p-1">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "scan"}
              onClick={() => setMode("scan")}
              className={clsx(
                "flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs transition-colors",
                mode === "scan"
                  ? "bg-primary font-bold text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Camera className="size-3.5" aria-hidden="true" />
              scan QR
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "manual"}
              onClick={() => setMode("manual")}
              className={clsx(
                "flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs transition-colors",
                mode === "manual"
                  ? "bg-primary font-bold text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Keyboard className="size-3.5" aria-hidden="true" />
              manual entry
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {mode === "scan" ? (
              <QrScanner onScan={verify} paused={checking} />
            ) : (
              <>
                <Input
                  id="qr-code"
                  label="QR value or ticket number"
                  placeholder="e.g. EVT-2026-123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) checkIn()
                  }}
                />
                <Button onClick={checkIn} loading={checking}>
                  <UserCheck className="size-4" aria-hidden="true" />
                  Check in attendee
                </Button>
              </>
            )}
            {lastResult && (
              <div
                role="status"
                className={
                  lastResult.ok
                    ? "flex items-start gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm text-success"
                    : "flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
                }
              >
                {lastResult.ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {lastResult.name ? `${lastResult.name}: ` : ""}
                  {lastResult.message}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground text-pretty">
              {mode === "scan"
                ? "Point the camera at the QR on an attendee's ticket (found in their \"My Registrations\" page). Verified tickets are checked in automatically."
                : "Tip: paste a ticket number or registration ID to manually check in an attendee."}
            </p>
          </div>
        </Card>

        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="w-full sm:max-w-xs">
                <Select
                  id="event-select"
                  label="Event"
                  value={eventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  {myEvents.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </Select>
              </div>
              {eventId && (
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{present}</strong> of{" "}
                  <strong className="text-foreground">{(attendance ?? []).length}</strong> checked in
                </p>
              )}
            </div>

            {!eventId || !attendance ? (
              <EmptyState title="Select an event" description="Choose one of your events to see its attendee list." />
            ) : attendance.length === 0 ? (
              <EmptyState title="No attendance records yet" description="Attendees will appear here once they check in." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 font-semibold">Attendee</th>
                      <th className="px-3 py-2 font-semibold">Email</th>
                      <th className="px-3 py-2 font-semibold">Checked In</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attendance.map((r: any) => {
                      const badge = attendanceBadge[r.status as AttendanceStatus] || attendanceBadge.NOT_MARKED
                      return (
                        <tr key={r.id} className="hover:bg-muted/50">
                          <td className="px-3 py-2.5 font-medium text-foreground">{r.userName || "Unknown"}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{r.userEmail || "—"}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {r.checkedInAt ? dayjs(r.checkedInAt).format("MMM D, YYYY · h:mm A") : "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
