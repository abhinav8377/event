import { Link } from "react-router-dom"
import { CalendarX } from "lucide-react"
import { Button } from "@/components/common/ui"

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <CalendarX className="size-16 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <p className="max-w-md text-muted-foreground text-pretty">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex gap-3">
        <Link to="/">
          <Button variant="outline">Go home</Button>
        </Link>
        <Link to="/">
          <Button>Browse events</Button>
        </Link>
      </div>
    </main>
  )
}
