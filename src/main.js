import "src/app.css"
import * as Sentry from "@sentry/browser"
import {addSession} from "@welshman/app"
import {getPubkey} from "@welshman/signer"
import {App as CapacitorApp} from "@capacitor/app"
import {nsecDecode} from "src/util/nostr"
import {router} from "src/app/util"
import App from "src/app/App.svelte"
import {installPrompt} from "src/partials/state"

// Nstart login - hash is replaced somewhere else, maybe router?
if (window.location.hash?.startsWith("#nostr-login")) {
  const params = new URLSearchParams(window.location.hash.slice(1))

  try {
    const secret = nsecDecode(params.get("nostr-login"))

    addSession({method: "nip01", secret, pubkey: getPubkey(secret)})
    setTimeout(() => router.at("/signup/welcome").open(), 300)
  } catch (e) {
    console.error(e)
  }
}

if (import.meta.env.VITE_GLITCHTIP_API_KEY) {
  Sentry.init({
    dsn: import.meta.env.VITE_GLITCHTIP_API_KEY,
    tracesSampleRate: 0.01,
    integrations(integrations) {
      return integrations.filter(integration => integration.name !== "Breadcrumbs")
    },
  })
}

// Analytics
window.plausible =
  window.plausible ||
  function () {
    ;(window.plausible.q = window.plausible.q || []).push(arguments)
  }

window.addEventListener("beforeinstallprompt", e => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault()

  // Stash the event so it can be triggered later.
  installPrompt.set(e)
})

// Handle back button on android
CapacitorApp.addListener("backButton", ({canGoBack}) => {
  if (!canGoBack) {
    CapacitorApp.exitApp()
  } else {
    window.history.back()
  }
})

export default new App({
  target: document.getElementById("app"),
})
