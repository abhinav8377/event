"use client"

import { useEffect } from "react"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { dismissToast, type Toast } from "@/features/toast/toastSlice"
import clsx from "clsx"

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const t = setTimeout(() => dispatch(dismissToast(toast.id)), 4000)
    return () => clearTimeout(t)
  }, [dispatch, toast.id])

  const Icon =
    toast.type === "success" ? CheckCircle2 : toast.type === "error" ? AlertCircle : Info

  return (
    <div
      role="status"
      className={clsx(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-card p-4 shadow-lg",
        toast.type === "success" && "border-success/30",
        toast.type === "error" && "border-destructive/30",
        toast.type === "info" && "border-border",
      )}
    >
      <Icon
        className={clsx(
          "mt-0.5 size-5 shrink-0",
          toast.type === "success" && "text-success",
          toast.type === "error" && "text-destructive",
          toast.type === "info" && "text-primary",
        )}
        aria-hidden="true"
      />
      <p className="flex-1 text-sm text-foreground text-pretty">{toast.message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dispatch(dismissToast(toast.id))}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useAppSelector((s) => s.toast.toasts)
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
