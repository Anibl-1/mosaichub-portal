'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

export interface ThemePreset {
  key: string
  label: string
  primary: string
  dark: string
  red: string
  redDark: string
  accent: string
  sectionBg: string
  headerBg: string
}

export const THEME_PRESETS: ThemePreset[] = [
  { key: 'classic-red',  label: '经典红',   primary: '#1a3a6b', dark: '#0d1f3c', red: '#c4161c', redDark: '#a01218', accent: '#2563eb', sectionBg: '#3a3a3a', headerBg: '#2c2c2c' },
  { key: 'tech-blue',    label: '科技蓝',   primary: '#1a56db', dark: '#1e3a8a', red: '#1a56db', redDark: '#1e40af', accent: '#3b82f6', sectionBg: '#1e3a5f', headerBg: '#172554' },
  { key: 'eco-green',    label: '生态绿',   primary: '#047857', dark: '#064e3b', red: '#059669', redDark: '#047857', accent: '#10b981', sectionBg: '#1a3a2a', headerBg: '#14332a' },
  { key: 'royal-purple', label: '创意紫',   primary: '#7c3aed', dark: '#5b21b6', red: '#7c3aed', redDark: '#6d28d9', accent: '#8b5cf6', sectionBg: '#3b1f6e', headerBg: '#2e1065' },
  { key: 'warm-orange',  label: '暖橙色',   primary: '#d97706', dark: '#92400e', red: '#d97706', redDark: '#b45309', accent: '#f59e0b', sectionBg: '#4a2c0a', headerBg: '#3b1f06' },
  { key: 'teal',         label: '湖水青',   primary: '#0891b2', dark: '#155e75', red: '#0891b2', redDark: '#0e7490', accent: '#06b6d4', sectionBg: '#164e63', headerBg: '#134152' },
  { key: 'rose',         label: '品红色',   primary: '#be185d', dark: '#9d174d', red: '#be185d', redDark: '#9d174d', accent: '#ec4899', sectionBg: '#4a0e2e', headerBg: '#3b0a24' },
  { key: 'slate',        label: '深空灰',   primary: '#334155', dark: '#1e293b', red: '#475569', redDark: '#334155', accent: '#64748b', sectionBg: '#1e293b', headerBg: '#0f172a' },
]

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r} ${g} ${b}`
}

function applyThemePreset(preset: ThemePreset) {
  const root = document.documentElement
  root.style.setProperty('--theme-primary-rgb', hexToRgb(preset.primary))
  root.style.setProperty('--theme-dark-rgb', hexToRgb(preset.dark))
  root.style.setProperty('--theme-red-rgb', hexToRgb(preset.red))
  root.style.setProperty('--theme-red-dark-rgb', hexToRgb(preset.redDark))
  root.style.setProperty('--theme-accent-rgb', hexToRgb(preset.accent))
  root.style.setProperty('--theme-section-bg-rgb', hexToRgb(preset.sectionBg))
  root.style.setProperty('--theme-header-bg-rgb', hexToRgb(preset.headerBg))
}

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
  themeColor: string
  setThemeColor: (key: string) => void
}>({
  theme: 'light',
  toggleTheme: () => {},
  themeColor: 'classic-red',
  setThemeColor: () => {},
})

export const useTheme = () => useContext(ThemeContext)

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [themeColor, setThemeColorState] = useState('classic-red')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark')
      document.documentElement.classList.add('dark')
    }
    // Load cached theme color first (instant, no flash)
    const cached = localStorage.getItem('theme_color')
    if (cached) {
      const preset = THEME_PRESETS.find(p => p.key === cached)
      if (preset) { applyThemePreset(preset); setThemeColorState(cached) }
    }
    // Load per-user theme color from DB (if logged in)
    const token = localStorage.getItem('token')
    if (token) {
      fetch('/api/user-preferences?key=theme_color', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.value) {
            const preset = THEME_PRESETS.find(p => p.key === data.value)
            if (preset) {
              applyThemePreset(preset)
              setThemeColorState(data.value)
              localStorage.setItem('theme_color', data.value)
            }
          }
        })
        .catch(() => {})
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const setThemeColor = (key: string) => {
    const preset = THEME_PRESETS.find(p => p.key === key)
    if (preset) {
      applyThemePreset(preset)
      setThemeColorState(key)
      localStorage.setItem('theme_color', key)
      // Persist to DB for logged-in user
      const token = localStorage.getItem('token')
      if (token) {
        fetch('/api/user-preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ key: 'theme_color', value: key }),
        }).catch(() => {})
      }
    }
  }

  if (!mounted) return <>{children}</>

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  )
}
