"use client"

import { useEffect } from "react"
import useSWR from "swr"
import { useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import dayjs from "dayjs"
import { useAppDispatch, useAppSelector } from "@/app/store"
import * as eventApi from "@/api/eventApi"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Button, Input, Textarea, Select, Loader } from "@/components/common/ui"

const banners = [
  { value: "/events/tech-conf.png", label: "Tech conference" },
  { value: "/events/hackathon.png", label: "Hackathon" },
  { value: "/events/startup-pitch.png", label: "Startup pitch" },
  { value: "/events/ai-workshop.png", label: "Workshop" },
  { value: "/events/city-marathon.png", label: "Sports / marathon" },
  { value: "/events/design-summit.png", label: "Arts / design" },
]

const schema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Short description must be at least 10 characters"),
    longDescription: z.string().min(20, "Full description must be at least 20 characters"),
    category: z.string(),
    mode: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]),
    banner: z.string(),
    venue: z.string(),
    city: z.string(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
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

type FormValues = z.infer<typeof schema>

export default function EventFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const user = useAppSelector((s) => s.auth.user)!
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const { data: existing, isLoading } = useSWR(isEdit ? ["event", id] : null, () =>
    eventApi.getEventById(id!).then((r) => r.data),
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      category: "Technology",
      mode: "IN_PERSON",
      banner: banners[0].value,
      capacity: 100,
      price: 0,
      tags: "",
      venue: "",
      city: "",
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
        price: existing.price,
        tags: existing.tags.join(", "),
      })
    }
  }, [existing, reset])

  const mode = watch("mode")
  const banner = watch("banner")

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
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
          <Textarea
            id="longDescription"
            label="Full description"
            placeholder="Tell attendees what to expect..."
            error={errors.longDescription?.message}
            {...register("longDescription")}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Select id="category" label="Category" error={errors.category?.message} {...register("category")}>
              {["Technology", "Business", "Education", "Health", "Arts", "Sports", "Community"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select id="mode" label="Event mode" error={errors.mode?.message} {...register("mode")}>
              <option value="IN_PERSON">In person</option>
              <option value="ONLINE">Online</option>
              <option value="HYBRID">Hybrid</option>
            </Select>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">Banner image</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {banners.map((b) => (
                <label key={b.value} className="cursor-pointer">
                  <input type="radio" value={b.value} className="peer sr-only" {...register("banner")} />
                  <img
                    src={b.value || "/placeholder.svg"}
                    alt={b.label}
                    className={
                      banner === b.value
                        ? "h-14 w-full rounded-lg border-2 border-primary object-cover"
                        : "h-14 w-full rounded-lg border-2 border-transparent object-cover opacity-70 hover:opacity-100"
                    }
                  />
                </label>
              ))}
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
            <Input
              id="price"
              type="number"
              label="Ticket price (USD, 0 = free)"
              min={0}
              step="0.01"
              error={errors.price?.message}
              {...register("price")}
            />
          </div>

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
