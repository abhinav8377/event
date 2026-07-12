"use client"

import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import useSWR from "swr"
import dayjs from "dayjs"
import {
  Search,
  SlidersHorizontal,
  CalendarX,
  Sparkles,
  Clock,
  MapPin,
  CalendarCheck,
  Zap,
  ArrowRight,
  RotateCw,
} from "lucide-react"
import clsx from "clsx"
import { getEvents } from "@/api/eventApi"
import { getUserDashboard } from "@/api/userApi"
import type { EventItem } from "@/constants/types"
import { EventCard } from "@/components/cards/EventCard"
import { PageHeader } from "@/components/common/PageHeader"
import { Select, Skeleton, EmptyState, Card, Badge, Button } from "@/components/common/ui"

const categories = ["All", "Technology", "Business", "Education", "Health", "Arts", "Sports", "Community"]
const modes = [
  { value: "All", label: "All modes" },
  { value: "IN_PERSON", label: "In person" },
  { value: "ONLINE", label: "Online" },
  { value: "HYBRID", label: "Hybrid" },
]

type Tab = "all" | "upcoming" | "suggested"

const CATEGORY_LABELS: Record<string, string> = {
  TECH: "Technology",
  BUSINESS: "Business",
  EDUCATION: "Education",
  CULTURE: "Arts",
  SPORTS: "Sports",
  COMMUNITY: "Community",
  OTHER: "Other",
}

export default function BrowseEventsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [mode, setMode] = useState("All")
  const [sort, setSort] = useState<"date" | "popular" | "rating">("date")

  const {
    data: allEvents,
    isLoading: eventsLoading,
    error: eventsError,
    mutate: refreshEvents,
  } = useSWR("all-events-browse", () => getEvents().then((r) => r.data))

  const {
    data: dashboard,
    isLoading: dashLoading,
    error: dashError,
    mutate: refreshDash,
  } = useSWR("user-dashboard-browse", () => getUserDashboard().then((r) => r.data))

  const filtered = useMemo(() => {
    if (!allEvents) return []
    let result = allEvents
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          e.tags.some((t) => t.includes(q)),
      )
    }
    if (category !== "All") result = result.filter((e) => e.category === category)
    if (mode !== "All") result = result.filter((e) => e.mode === mode)
    return [...result].sort((a, b) => {
      if (sort === "popular") return b.views - a.views
      if (sort === "rating") return b.rating - a.rating
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    })
  }, [allEvents, search, category, mode, sort])

  const isLoading = eventsLoading || dashLoading
  const hasError = eventsError || dashError

  const upcomingRegistered = dashboard?.upcomingRegistered || []
  const suggestions = dashboard?.suggestions || []

  const syncAll = () => {
    refreshEvents()
    refreshDash()
  }

  const tabs: { key: Tab; label: string; icon: typeof Clock; count?: number }[] = [
    { key: "all", label: "All Events", icon: Sparkles, count: filtered.length },
    { key: "upcoming", label: "My Upcoming", icon: CalendarCheck, count: upcomingRegistered.length },
    { key: "suggested", label: "Suggested For You", icon: Zap, count: suggestions.length },
  ]

  return (
    <div>
      <PageHeader
        title="Browse Events"
        description="Discover, search, and register for events happening around you."
        action={
          <Button size="sm" variant="outline" onClick={syncAll}>
            <RotateCw className="size-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, cities, or tags..."
            aria-label="Search events"
            className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SlidersHorizontal className="hidden size-4 text-muted-foreground lg:block" aria-hidden="true" />
          <Select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-auto min-w-36">
            {categories.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All categories" : c}</option>
            ))}
          </Select>
          <Select aria-label="Filter by mode" value={mode} onChange={(e) => setMode(e.target.value)} className="w-auto min-w-32">
            {modes.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>
          <Select aria-label="Sort events" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="w-auto min-w-32">
            <option value="date">Soonest first</option>
            <option value="popular">Most popular</option>
            <option value="rating">Top rated</option>
          </Select>
        </div>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              "flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="size-4" aria-hidden="true" />
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={clsx(
                  "ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  activeTab === tab.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {hasError ? (
        <EmptyState
          icon={<CalendarX className="size-10" aria-hidden="true" />}
          title="Failed to load events"
          description="Something went wrong. Please try again."
          action={
            <Button size="sm" onClick={syncAll}>
              <RotateCw className="size-4" aria-hidden="true" />
              Retry
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      ) : activeTab === "all" ? (
        filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarX className="size-10" aria-hidden="true" />}
            title="No events match your filters"
            description="Try a different search term or clear the category and mode filters."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => (
              <EventCard key={e.id} event={e} detailPath="/user/events" />
            ))}
          </div>
        )
      ) : activeTab === "upcoming" ? (
        upcomingRegistered.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="size-10" aria-hidden="true" />}
            title="No upcoming events"
            description="You haven't registered for any upcoming events yet."
            action={
              <Button size="sm" onClick={() => setActiveTab("all")}>
                Browse events
                <ArrowRight className="ml-1.5 size-3.5" />
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingRegistered.map((event) => (
              <Link key={event.id} to={`/user/events/${event.id}`}>
                <Card className="group overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-black/5">
                  <div className="relative h-36 overflow-hidden">
                    {event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={event.title}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/15 via-primary/5 to-transparent">
                        <CalendarCheck className="size-12 text-primary/20" />
                      </div>
                    )}
                    <Badge variant="success" className="absolute left-3 top-3">
                      Registered
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate font-bold text-foreground">{event.title}</h3>
                    <div className="mt-2.5 space-y-1.5">
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3.5 shrink-0 text-primary" />
                        {dayjs(event.date).format("ddd, MMM D, YYYY")}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0 text-primary" />
                        {event.venue || event.city || "TBA"}
                      </p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[event.category] || event.category}
                      </Badge>
                      <Badge variant="accent" className="text-xs">
                        {event.mode.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )
      ) : (
        suggestions.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="size-10" aria-hidden="true" />}
            title="No suggestions yet"
            description="Register for some events and we'll suggest similar ones for you!"
            action={
              <Button size="sm" onClick={() => setActiveTab("all")}>
                Explore events
                <ArrowRight className="ml-1.5 size-3.5" />
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {suggestions.map((event) => (
              <Link key={event.id} to={`/user/events/${event.id}`}>
                <Card className="group overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-black/5">
                  <div className="relative h-28 overflow-hidden">
                    {event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={event.title}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-linear-to-br from-accent/25 via-accent/10 to-transparent">
                        <Sparkles className="size-10 text-accent/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="truncate font-bold text-foreground">{event.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {event.description}
                    </p>
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5 shrink-0 text-primary" />
                      {dayjs(event.date).format("ddd, MMM D · h:mm A")}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[event.category] || event.category}
                        </Badge>
                        {event.price > 0 ? (
                          <Badge variant="warning" className="text-xs">
                            ₹{event.price}
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-xs">
                            Free
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}
