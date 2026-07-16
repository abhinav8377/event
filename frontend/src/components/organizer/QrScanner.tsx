"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import jsQR from "jsqr"
import { Camera, CameraOff, ScanLine } from "lucide-react"
import { Button } from "@/components/common/ui"

type QrScannerProps = {
  /** Called with the decoded QR text. Return value ignored. */
  onScan: (value: string) => void
  /** Pause decoding (e.g. while a check-in request is in flight). */
  paused?: boolean
}

type ScannerState = "idle" | "starting" | "active" | "denied" | "unavailable" | "insecure"

export function QrScanner({ onScan, paused = false }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const lastScanRef = useRef<{ value: string; at: number }>({ value: "", at: 0 })
  const pausedRef = useRef(paused)
  const onScanRef = useRef(onScan)
  const [state, setState] = useState<ScannerState>("idle")

  pausedRef.current = paused
  onScanRef.current = onScan

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setState("idle")
  }, [])

  const tick = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && !pausedRef.current) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const result = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        })
        if (result?.data) {
          const now = Date.now()
          const last = lastScanRef.current
          // Debounce: ignore the same code within 3s so one ticket isn't spammed
          if (result.data !== last.value || now - last.at > 3000) {
            lastScanRef.current = { value: result.data, at: now }
            onScanRef.current(result.data)
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(async () => {
    // Cameras require a secure context (HTTPS or localhost). Over a plain-HTTP
    // LAN address (e.g. http://192.168.x.x) mediaDevices is undefined on phones,
    // which is why it works on laptop/localhost but fails on mobile.
    const md = navigator.mediaDevices
    if (!md?.getUserMedia) {
      if (
        typeof window !== "undefined" &&
        window.isSecureContext === false &&
        !["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)
      ) {
        setState("insecure")
      } else {
        setState("unavailable")
      }
      return
    }
    setState("starting")
    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setState("active")
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      setState("denied")
    }
  }, [tick])

  useEffect(() => stop, [stop])

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-black">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video ref={videoRef} playsInline muted className="size-full object-cover" />
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        {state === "active" && (
          <>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <div className="size-3/5 rounded-2xl border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 font-mono text-xs text-white backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-success" aria-hidden="true" />
              scanning
            </span>
          </>
        )}

        {state !== "active" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            {state === "denied" ? (
              <>
                <CameraOff className="size-8 text-destructive" aria-hidden="true" />
                <p className="text-sm text-white">
                  Camera access denied. Allow camera permission in your browser and try again.
                </p>
              </>
            ) : state === "insecure" ? (
              <>
                <CameraOff className="size-8 text-destructive" aria-hidden="true" />
                <p className="text-sm text-white">
                  Camera needs a secure connection. Open this page over <b>HTTPS</b> (or via
                  localhost) instead of a plain http:// LAN address.
                </p>
              </>
            ) : state === "unavailable" ? (
              <>
                <CameraOff className="size-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-white">Camera is not available on this device or browser.</p>
              </>
            ) : (
              <>
                <ScanLine className="size-8 text-primary" aria-hidden="true" />
                <p className="text-sm text-white text-pretty">
                  Point the camera at an attendee&apos;s ticket QR to check them in instantly.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {state === "active" ? (
        <Button variant="outline" onClick={stop}>
          <CameraOff className="size-4" aria-hidden="true" />
          Stop camera
        </Button>
      ) : (
        <Button onClick={start} loading={state === "starting"}>
          <Camera className="size-4" aria-hidden="true" />
          {state === "denied" || state === "unavailable" || state === "insecure" ? "Retry camera" : "Start camera scan"}
        </Button>
      )}
    </div>
  )
}
