import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

const COOP_POSTMESSAGE_WARNING = 'Cross-Origin-Opener-Policy policy would block the window.postMessage call.'

const shouldIgnoreConsoleMessage = (args = []) =>
  args.some((arg) => typeof arg === 'string' && arg.includes(COOP_POSTMESSAGE_WARNING))

const originalConsoleWarn = console.warn.bind(console)
const originalConsoleError = console.error.bind(console)

console.warn = (...args) => {
  if (shouldIgnoreConsoleMessage(args)) return
  originalConsoleWarn(...args)
}

console.error = (...args) => {
  if (shouldIgnoreConsoleMessage(args)) return
  originalConsoleError(...args)
}

// Reduce noisy debug logs in production, keep warn/error visible.
if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_DEBUG_LOGS !== 'true') {
  console.log = () => {}
  console.info = () => {}
  console.debug = () => {}
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
// Force redeploy Wed Mar 25 12:30:49     2026
