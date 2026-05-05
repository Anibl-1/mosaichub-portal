'use client'

import { useState, useEffect } from 'react'

/** Default site configuration — no sensitive / company-specific text */
export const siteDefaults: Record<string, string> = {
  site_name: '',
  site_short_name: '',
  site_logo_text: '',
  site_logo_subtitle: '',
  site_hotline: '',
  site_copyright: '',
  site_icp: '',
  site_description: '',
}

let cache: Record<string, string> | null = null
let fetching = false
const listeners = new Set<(s: Record<string, string>) => void>()

function notifyAll(s: Record<string, string>) {
  listeners.forEach(fn => fn(s))
}

/**
 * Shared hook — fetches /api/settings once, caches in memory,
 * returns merged defaults + DB values.
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState<Record<string, string>>(cache || siteDefaults)

  useEffect(() => {
    listeners.add(setSettings)
    if (cache) { setSettings(cache); return () => { listeners.delete(setSettings) } }
    if (!fetching) {
      fetching = true
      fetch('/api/settings')
        .then(r => r.json())
        .then((data: Array<{ key: string; value: string }>) => {
          const map: Record<string, string> = { ...siteDefaults }
          data.forEach(s => { if (s.value) map[s.key] = s.value })
          cache = map
          notifyAll(map)
        })
        .catch(() => { fetching = false })
    }
    return () => { listeners.delete(setSettings) }
  }, [])

  return settings
}
