import { Link } from "react-router-dom"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/common/ui"

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldAlert className="size-16 text-destructive" aria-hidden="true" />
      <h1 className="text-4xl font-bold text-foreground">403</h1>
      <p className="max-w-md text-muted-foreground text-pretty">
        You don&apos;t have permission to access this page with your current role.
      </p>
      <Link to="/">
        <Button>Go home</Button>
      </Link>
    </main>
  )
}
