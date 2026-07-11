"use client"

import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import dayjs from "dayjs"
import { Upload, X } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/store"
import * as eventApi from "@/api/eventApi"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Button, Input, Select, Loader } from "@/components/common/ui"
import QuillEditor from "@/components/common/QuillEditor"

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

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isEdit ? "Edit event" : "Create event"}
        description={
          isEdit
            ? "Update your event details."
            : "New events are saved as drafts — publish them from My Events when ready."
        }
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
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
          <div>
            <label className="text-sm font-medium text-foreground">Full description</label>
            <p className="text-xs text-muted-foreground mb-2">
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
              <p className="mt-1 text-sm text-destructive">{errors.longDescription.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input id="category" label="Category" placeholder="e.g. Technology, Sports, Business" error={errors.category?.message} {...register("category")} />
            <Select id="mode" label="Event mode" error={errors.mode?.message} {...register("mode")}>
              <option value="IN_PERSON">In person</option>
              <option value="ONLINE">Online</option>
              <option value="HYBRID">Hybrid</option>
            </Select>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Banner image</p>
              {customBanner && (
                <button
                  type="button"
                  onClick={() => { setCustomBanner(null); reset({ ...watch(), banner: banners[0].value }) }}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <X className="size-3.5" />
                  Remove custom
                </button>
              )}
            </div>

            {customBanner ? (
              <div className="group relative mb-4 overflow-hidden rounded-xl border border-border bg-muted">
                <img
                  src={customBanner}
                  alt="Custom banner"
                  className="h-44 w-full object-cover"
                />
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
                      className={
                        banner === b.value
                          ? "h-14 w-full rounded-lg border-2 border-primary object-cover ring-1 ring-primary/30"
                          : "h-14 w-full rounded-lg border-2 border-border object-cover opacity-70 ring-1 ring-transparent transition-all duration-200 group-hover:opacity-100 group-hover:ring-muted-foreground/30"
                      }
                    />
                    <span className={
                      banner === b.value
                        ? "mt-1 block truncate text-center text-[10px] font-semibold text-primary"
                        : "mt-1 block truncate text-center text-[10px] text-muted-foreground"
                    }>
                      {b.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div className="mt-4">
              <label
                onClick={() => fileRef.current?.click()}
                className="relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 px-4 py-6 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5"
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
          </div>

          {mode !== "ONLINE" && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input
                id="venue"
                label="Venue"
                placeholder="e.g. Convention Center Hall A"
                error={errors.venue?.message}
                {...register("venue")}
              />
              <Input id="city" label="City" placeholder="e.g. San Francisco" error={errors.city?.message} {...register("city")} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              id="startDate"
              type="datetime-local"
              label="Starts"
              error={errors.startDate?.message}
              {...register("startDate")}
            />
            <Input
              id="endDate"
              type="datetime-local"
              label="Ends"
              error={errors.endDate?.message}
              {...register("endDate")}
            />
          </div>

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
            <Input
              id="price"
              type="number"
              label="Ticket price (USD)"
              min={1}
              step="0.01"
              placeholder="e.g. 25.00"
              error={errors.price?.message}
              {...register("price")}
            />
          )}

          <Input
            id="tags"
            label="Tags (comma separated)"
            placeholder="e.g. react, networking, beginner-friendly"
            error={errors.tags?.message}
            {...register("tags")}
          />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/organizer/events")}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? "Save changes" : "Create draft"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
