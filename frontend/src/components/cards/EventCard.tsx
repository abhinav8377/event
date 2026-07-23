import { Link } from "react-router-dom"
import { CalendarDays, MapPin, Users, Star, BadgeCheck } from "lucide-react"
import dayjs from "dayjs"
import type { EventItem } from "@/constants/types"
import { Badge, Card } from "@/components/common/ui"

const modeLabel = { IN_PERSON: "In person", ONLINE: "Online", HYBRID: "Hybrid" }

export function EventCard({ event, detailPath }: { event: EventItem; detailPath?: string }) {
  const spotsLeft = event.capacity - event.registeredCount
  const isPast = new Date(event.endDate).getTime() < Date.now()

  return (
    <Card className="group flex flex-col overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-black/5">
      <Link to={`${detailPath || "/events"}/${event.id}`} className="flex h-full flex-col">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={event.banner || "/placeholder.svg"}
            alt={event.title}
            loading="lazy"
            fetchpriority="low"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge className="border border-border bg-card/90 text-foreground backdrop-blur">{event.category.toLowerCase()}</Badge>
            <Badge className="border border-border bg-card/90 text-muted-foreground backdrop-blur">{modeLabel[event.mode].toLowerCase()}</Badge>
          </div>
          {event.price === 0 ? (
            <Badge variant="success" className="absolute right-3 top-3 bg-success text-success-foreground">
              free
            </Badge>
          ) : (
            <Badge className="absolute right-3 top-3 border border-border bg-card/90 text-foreground backdrop-blur">
              {"₹"}{event.price}
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="font-extrabold leading-snug tracking-tight text-foreground text-balance">{event.title}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <span className="font-medium text-muted-foreground">{event.organizerOrganization}</span>
              {event.organizerVerified && (
                <BadgeCheck className="size-3.5 text-primary" aria-label="Verified organizer" />
              )}
            </p>
          </div>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {event.description}
          </p>
          <div className="mt-auto flex flex-col gap-1.5 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-primary" aria-hidden="true" />
              {dayjs(event.startDate).format("ddd, MMM D, YYYY · h:mm A")}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" aria-hidden="true" />
              {event.venue}, {event.city}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="size-3.5" aria-hidden="true" />
              {event.registeredCount.toLocaleString()} registered
            </span>
            {event.rating > 0 && (
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
                {event.rating}
              </span>
            )}
            {!isPast && spotsLeft > 0 && spotsLeft <= 20 && (
              <Badge variant="warning">{spotsLeft} spots left</Badge>
            )}
            {!isPast && spotsLeft <= 0 && <Badge variant="destructive">Full</Badge>}
            {isPast && <Badge variant="outline">Ended</Badge>}
          </div>
        </div>
      </Link>
    </Card>
  )
}
