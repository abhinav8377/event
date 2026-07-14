import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import { ClerkProvider } from "@clerk/clerk-react"
import { store } from "@/app/store"
import App from "@/App"
import { initTheme } from "@/hooks/useTheme"
import "@/globals.css"

initTheme()

window.addEventListener("beforeunload", () => {
  localStorage.removeItem("eventhub_token")
  localStorage.removeItem("eventhub_user")
})

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const appTree = (
  <Provider store={store}>
    <App />
  </Provider>
)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {clerkPublishableKey ? (
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        afterSignInUrl="/sso-complete"
        afterSignUpUrl="/sso-complete"
        afterSignOutUrl="/"
      >
        {appTree}
      </ClerkProvider>
    ) : (
      appTree
    )}
  </StrictMode>,
)
