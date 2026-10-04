import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// On a browser refresh, always land on the dashboard (auth pages are left alone)
const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
const AUTH_PATHS = ['/login', '/register']
if (nav?.type === 'reload' && window.location.pathname !== '/' && !AUTH_PATHS.includes(window.location.pathname)) {
  window.history.replaceState(null, '', '/')
}

const root = document.getElementById('root')
if (!root) throw new Error('Failed to find root element')
createRoot(root).render(
  <App />
)
