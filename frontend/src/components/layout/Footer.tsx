import { Link } from "react-router-dom"
import { CalendarRange } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 md:flex-row md:items-start md:justify-between md:px-6">
        <div className="max-w-xs">
          <Link to="/" className="flex items-center gap-2.5 font-extrabold tracking-tight text-foreground">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarRange className="size-4" aria-hidden="true" />
            </span>
            <span>
              Event<span className="text-primary">Hub</span>
            </span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            One platform for discovering events, seamless registration, QR check-in, and automatic certificates.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-foreground">Platform</p>
            <Link to="/events" className="text-sm text-muted-foreground hover:text-foreground">Explore Events</Link>
            <Link to="/register" className="text-sm text-muted-foreground hover:text-foreground">Become an Organizer</Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Log in</Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-foreground">Company</p>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-foreground">Legal</p>
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4">
        <p className="mx-auto max-w-6xl px-4 font-mono text-xs text-muted-foreground md:px-6">
          &copy; {new Date().getFullYear()} EventHub — all rights reserved
        </p>
      </div>
    </footer>
  )
}
