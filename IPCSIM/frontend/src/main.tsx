import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// @ts-ignore: Allow CSS side-effect import without type declarations
import './index.css'

// Development helper: render client-side errors visibly on the page
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e: ErrorEvent) => {
    try {
      const pre = document.createElement('pre')
      pre.id = '__client_error__'
      pre.style.whiteSpace = 'pre-wrap'
      pre.style.background = '#fee'
      pre.style.color = '#900'
      pre.style.padding = '16px'
      pre.innerText = `${e.message}\n${e.filename}:${e.lineno}:${e.colno}\n${(e.error && (e.error as any).stack) || ''}`
      document.body.appendChild(pre)
    } catch (err) {
      // ignore
    }
  })

  window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
    try {
      const pre = document.createElement('pre')
      pre.id = '__client_error__'
      pre.style.whiteSpace = 'pre-wrap'
      pre.style.background = '#fee'
      pre.style.color = '#900'
      pre.style.padding = '16px'
      const reason = (ev.reason && ev.reason.stack) || String(ev.reason)
      pre.innerText = `UnhandledRejection: ${reason}`
      document.body.appendChild(pre)
    } catch (err) {
      // ignore
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
