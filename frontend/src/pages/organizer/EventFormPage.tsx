"use client"

import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import dayjs from "dayjs"
import { Upload, X, Type, AlignLeft, LayoutGrid, Image as ImageIcon, MapPin, CalendarClock, Ticket, Tag, Eye, Sparkles } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/store"
import * as eventApi from "@/api/eventApi"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Button, Input, Select, Loader } from "@/components/common/ui"
import QuillEditor from "@/components/common/QuillEditor"
import VenueMapPicker from "@/components/common/VenueMapPicker"

const banners = [
  { value: "/events/tech-conf.png", label: "Tech conference" },
  { value: "/events/hackathon.png", label: "Hackathon" },
  { value: "/events/startup-pitch.png", label: "Startup pitch" },
  { value: "/events/ai-workshop.png", label: "Workshop" },
  { value: "/events/city-marathon.png", label: "Sports / marathon" },
  { value: "/events/design-summit.png", label: "Arts / design" },
]

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim()

const schema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Short description must be at least 10 characters"),
    longDescription: z.string().refine(
      (val) => stripHtml(val).length >= 20,
      "Full description must be at least 20 characters of content"
    ),
    category: z.string(),
    mode: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]),
    banner: z.string(),
    venue: z.string(),
    city: z.string(),
    latitude: z.coerce.number().min(-90).max(90).nullable(),
    longitude: z.coerce.number().min(-180).max(180).nullable(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
    eventType: z.enum(["FREE", "PAID"]),
    price: z.coerce.number().min(0, "Price cannot be negative"),
    tags: z.string(),
  })
  .refine((v) => new Date(v.endDate) > new Date(v.startDate), {
    message: "End date must be after the start date",
    path: ["endDate"],
  })
  .refine((v) => new Date(v.startDate) >= new Date(), {
    message: "Start date cannot be in the past",
    path: ["startDate"],
  })
  .refine((v) => v.mode === "ONLINE" || (v.venue.trim() && v.city.trim()), {
    message: "Venue and city are required for in-person events",
    path: ["venue"],
  })
  .refine((v) => v.eventType === "FREE" || v.price > 0, {
    message: "Price must be greater than 0 for paid events",
    path: ["price"],
  })

type FormValues = z.infer<typeof schema>

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024

function Section({
  title,
  eyebrow,
  icon,
  children,
}: {
  title: string
  eyebrow?: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className="p-5 transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] sm:p-6">
      <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
        {icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            {icon}
          </span>
        )}
        <div>
          {eyebrow && (
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              {eyebrow}
            </p>
          )}
          <h3 className="text-base font-bold tracking-tight text-foreground">{title}</h3>
        </div>
      </div>
      {children}
    </Card>
  )
}

const MODE_LABEL: Record<string, string> = {
  IN_PERSON: "In person",
  ONLINE: "Online",
  HYBRID: "Hybrid",
}

export default function EventFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const user = useAppSelector((s) => s.auth.user)!
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [customBanner, setCustomBanner] = useState<string | null>(null)

  const { data: existing, isLoading } = useSWR(isEdit ? ["event", id] : null, () =>
    eventApi.getEventById(id!).then((r) => r.data),
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      category: "Technology",
      mode: "IN_PERSON",
      banner: banners[0].value,
      capacity: 100,
      eventType: "FREE",
      price: 0,
      tags: "",
      venue: "",
      city: "",
      latitude: null,
      longitude: null,
      longDescription: "",
    },
  })

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        description: existing.description,
        longDescription: existing.longDescription,
        category: existing.category,
        mode: existing.mode,
        banner: existing.banner,
        venue: existing.venue,
        city: existing.city,
        latitude: existing.latitude,
        longitude: existing.longitude,
        startDate: dayjs(existing.startDate).format("YYYY-MM-DDTHH:mm"),
        endDate: dayjs(existing.endDate).format("YYYY-MM-DDTHH:mm"),
        capacity: existing.capacity,
        eventType: existing.price > 0 ? "PAID" : "FREE",
        price: existing.price,
        tags: existing.tags.join(", "),
      })
    }
  }, [existing, reset])

  const mode = watch("mode")
  const banner = watch("banner")
  const eventType = watch("eventType")
  const latitude = watch("latitude")
  const longitude = watch("longitude")

  const now = dayjs().format("YYYY-MM-DDTHH:mm")

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      dispatch(pushToast({ type: "error", message: "Only JPG, PNG, GIF, and WebP images are allowed" }))
      return
    }
    if (file.size > MAX_SIZE) {
      dispatch(pushToast({ type: "error", message: "File must be under 5 MB" }))
      return
    }

    setUploading(true)
    try {
      const res = await eventApi.uploadBannerImage(file)
      setCustomBanner(res.url)
      dispatch(pushToast({ type: "success", message: "Banner uploaded" }))
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message }))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      price: values.eventType === "FREE" ? 0 : values.price,
      banner: customBanner || values.banner,
      latitude: values.latitude,
      longitude: values.longitude,
      category: values.category as never,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      tags: values.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    }
    try {
      const res = isEdit
        ? await eventApi.updateEvent(id!, payload)
        : await eventApi.createEvent(user.id, user.organization ?? user.name, payload)
      dispatch(pushToast({ type: "success", message: res.message }))
      navigate("/organizer/events")
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message }))
    }
  }

  if (isEdit && isLoading) return <Loader />

  const previewBanner = customBanner || banner
  const previewTitle = watch("title") || "Untitled event"
  const previewDesc = watch("description") || "Your event summary will appear here."
  const previewStart = watch("startDate") ? dayjs(watch("startDate")) : null
  const previewEnd = watch("endDate") ? dayjs(watch("endDate")) : null
  const previewTags = (watch("tags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
  const previewPrice = eventType === "PAID" ? Number(watch("price")) || 0 : 0

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-grid bg-grid-fade opacity-70"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl">
        <PageHeader
          title={isEdit ? "Edit event" : "Create event"}
          description={
            isEdit
              ? "Update your event details and republish when ready."
              : "New events are saved as drafts — publish them from My Events when ready."
          }
        />

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-3" noValidate>
          {/* ───────────────── Main column ───────────────── */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Section title="Event basics" eyebrow="Step 01" icon={<Type className="size-4" />}>
              <div className="flex flex-col gap-5">
                <Input
                  id="title"
                  label="Event title"
                  placeholder="e.g. DevConf 2026"
                  error={errors.title?.message}
                  {...register("title")}
                />
                <Input
                  id="description"
                  label="Short description"
                  placeholder="One-line summary shown on event cards"
                  error={errors.description?.message}
                  {...register("description")}
                />
              </div>
            </Section>

            <Section title="Full description" eyebrow="Step 02" icon={<AlignLeft className="size-4" />}>
              <label className="mb-2 block text-sm font-medium text-foreground">Event details</label>
              <p className="mb-3 text-xs text-muted-foreground">
                Use headings, bold, lists, and formatting to create a structured event description.
              </p>
              <QuillEditor
                value={watch("longDescription") || ""}
                onChange={(val) => {
                  setValue("longDescription", val, { shouldValidate: true, shouldDirty: true })
                }}
                placeholder="Tell attendees what to expect — use headings, lists, bold text, and more to structure your description..."
              />
              {errors.longDescription?.message && (
                <p className="mt-2 text-sm text-destructive">{errors.longDescription.message}</p>
              )}
            </Section>

            <Section title="Category & mode" eyebrow="Step 03" icon={<LayoutGrid className="size-4" />}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  id="category"
                  label="Category"
                  placeholder="e.g. Technology, Sports, Business"
                  error={errors.category?.message}
                  {...register("category")}
                />
                <Select id="mode" label="Event mode" error={errors.mode?.message} {...register("mode")}>
                  <option value="IN_PERSON">In person</option>
                  <option value="ONLINE">Online</option>
                  <option value="HYBRID">Hybrid</option>
                </Select>
              </div>
            </Section>

            <Section title="Banner & artwork" eyebrow="Step 04" icon={<ImageIcon className="size-4" />}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Choose a cover image</p>
                {customBanner && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomBanner(null)
                      reset({ ...watch(), banner: banners[0].value })
                    }}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <X className="size-3.5" />
                    Remove custom
                  </button>
                )}
              </div>

              {customBanner ? (
                <div className="group relative mb-4 overflow-hidden rounded-xl border border-border bg-muted">
                  <img src={customBanner} alt="Custom banner" loading="lazy" fetchpriority="low" className="h-44 w-full object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      <span className="size-1.5 rounded-full bg-white" />
                      Custom upload
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {banners.map((b) => (
                    <label key={b.value} className="group relative cursor-pointer">
                      <input type="radio" value={b.value} className="peer sr-only" {...register("banner")} />
                      <img
                        src={b.value || "/placeholder.svg"}
                        alt={b.label}
                        loading="lazy"
                        className={
                          banner === b.value
                            ? "h-14 w-full rounded-lg border-2 border-primary object-cover ring-1 ring-primary/30"
                            : "h-14 w-full rounded-lg border-2 border-border object-cover opacity-70 ring-1 ring-transparent transition-all duration-200 group-hover:opacity-100 group-hover:ring-muted-foreground/30"
                        }
                      />
                      <span
                        className={
                          banner === b.value
                            ? "mt-1 block truncate text-center text-[10px] font-semibold text-primary"
                            : "mt-1 block truncate text-center text-[10px] text-muted-foreground"
                        }
                      >
                        {b.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <label
                  onClick={() => fileRef.current?.click()}
                  className="group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 px-4 py-6 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5"
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                    className="sr-only"
                    onChange={handleFile}
                  />
                  {uploading ? (
                    <>
                      <span className="relative flex size-10 items-center justify-center rounded-full bg-primary/10">
                        <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">Uploading...</span>
                      <span className="text-xs text-muted-foreground/60">Please wait while we process your image</span>
                    </>
                  ) : (
                    <>
                      <span className="relative flex size-10 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <Upload className="size-5 text-primary" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {customBanner ? "Replace with another image" : "Upload a custom banner"}
                      </span>
                      <span className="text-xs text-muted-foreground/60">JPG, PNG, GIF, WebP &middot; Max 5 MB</span>
                    </>
                  )}
                </label>
              </div>
            </Section>

            {mode !== "ONLINE" && (
              <Section title="Location" eyebrow="Step 05" icon={<MapPin className="size-4" />}>
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input
                      id="venue"
                      label="Venue"
                      placeholder="e.g. Convention Center Hall A"
                      error={errors.venue?.message}
                      {...register("venue")}
                    />
                    <Input
                      id="city"
                      label="City"
                      placeholder="e.g. San Francisco"
                      error={errors.city?.message}
                      {...register("city")}
                    />
                  </div>
                  <VenueMapPicker
                    latitude={latitude}
                    longitude={longitude}
                    onChange={(lat, lng) => {
                      setValue("latitude", lat, { shouldValidate: true, shouldDirty: true })
                      setValue("longitude", lng, { shouldValidate: true, shouldDirty: true })
                    }}
                  />
                </div>
              </Section>
            )}

            <Section title="Schedule" eyebrow="Step 06" icon={<CalendarClock className="size-4" />}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  id="startDate"
                  type="datetime-local"
                  label="Starts"
                  min={now}
                  error={errors.startDate?.message}
                  {...register("startDate")}
                />
                <Input
                  id="endDate"
                  type="datetime-local"
                  label="Ends"
                  min={now}
                  error={errors.endDate?.message}
                  {...register("endDate")}
                />
              </div>
            </Section>

            <Section title="Capacity & pricing" eyebrow="Step 07" icon={<Ticket className="size-4" />}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  id="capacity"
                  type="number"
                  label="Capacity"
                  min={1}
                  error={errors.capacity?.message}
                  {...register("capacity")}
                />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="eventType" className="text-sm font-medium text-foreground">
                    Event type
                  </label>
                  <select
                    id="eventType"
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    {...register("eventType", {
                      onChange: (e) => {
                        if (e.target.value === "FREE") setValue("price", 0, { shouldValidate: true, shouldDirty: true })
                      },
                    })}
                  >
                    <option value="FREE">Free</option>
                    <option value="PAID">Paid</option>
                  </select>
                  {errors.eventType?.message && <p className="text-xs text-destructive">{errors.eventType.message}</p>}
                </div>
              </div>

              {eventType === "PAID" && (
                <div className="mt-5">
                    <Input
                      id="price"
                      type="number"
                      label="Ticket price (INR)"
                      min={1}
                      step="0.01"
                      placeholder="e.g. 25.00"
                      error={errors.price?.message}
                      {...register("price")}
                    />
                </div>
              )}
            </Section>

            <Section title="Tags" eyebrow="Step 08" icon={<Tag className="size-4" />}>
              <Input
                id="tags"
                label="Tags (comma separated)"
                placeholder="e.g. react, networking, beginner-friendly"
                error={errors.tags?.message}
                {...register("tags")}
              />
            </Section>
          </div>

          {/* ───────────────── Preview sidebar ───────────────── */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 flex flex-col gap-4">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="relative">
                  <img
                    src={previewBanner || "/placeholder.svg"}
                    alt="Event banner preview"
                    loading="lazy"
                    className="h-40 w-full object-cover"
                  />
                  <div className="absolute right-3 top-3 flex gap-2">
                    <span className="rounded-full bg-black/55 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                      {MODE_LABEL[mode] || mode}
                    </span>
                    <span className="rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                      {watch("category") || "Category"}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2 text-primary">
                    <Eye className="size-4" />
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]">
                      Live preview
                    </span>
                  </div>
                  <h4 className="text-lg font-bold leading-snug tracking-tight text-foreground">
                    {previewTitle}
                  </h4>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{previewDesc}</p>

                  <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
                    <div className="flex items-start gap-2.5">
                      <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span className="text-foreground">
                        {previewStart?.isValid() ? previewStart.format("MMM D, YYYY · h:mm A") : "Start date"}
                        {previewEnd?.isValid() && (
                          <span className="text-muted-foreground">
                            {" → "}
                            {previewEnd.format("MMM D, YYYY · h:mm A")}
                          </span>
                        )}
                      </span>
                    </div>
                    {mode !== "ONLINE" && (
                      <div className="flex items-start gap-2.5">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <span className="text-foreground">
                          {watch("venue") || "Venue"}
                          {watch("city") && <span className="text-muted-foreground">, {watch("city")}</span>}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-2.5">
                      <Ticket className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span className="text-foreground">
                        {watch("capacity") || 0} seats &middot;{" "}
                        {eventType === "PAID" ? (
                          <span className="font-semibold text-primary">₹{previewPrice}</span>
                        ) : (
                          <span className="font-semibold text-success">Free</span>
                        )}
                      </span>
                    </div>
                  </dl>

                  {previewTags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-4">
                      {previewTags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-accent px-2.5 py-0.5 font-mono text-[10px] font-medium text-accent-foreground"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4">
                <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
                  <Sparkles className="size-4" />
                  {isEdit ? "Save changes" : "Create draft"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/organizer/events")} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  )
}
