import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import { ClerkProvider } from "@clerk/clerk-react"
import { store } from "@/app/store"
import App from "@/App"
import { initTheme } from "@/hooks/useTheme"
import "leaflet/dist/leaflet.css"
import "@/globals.css"

initTheme()

const appTree = (
  <Provider store={store}>
    <App />
  </Provider>
)

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {clerkPublishableKey ? (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        {appTree}
      </ClerkProvider>
    ) : (
      appTree
    )}
  </StrictMode>,
)