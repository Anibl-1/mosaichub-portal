'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, LogOut, Settings, Menu, X, Search, Phone, PenSquare, Moon, Sun, ChevronDown, Palette, Languages } from 'lucide-react'
import { useTheme, THEME_PRESETS } from './ThemeProvider'
import { useSiteSettings } from '@/lib/useSiteSettings'
import { useLanguage } from './LanguageProvider'
import { translateText } from '@/lib/i18n'

interface NavMenuItem {
  id: number
  name: string
  url: string | null
  icon: string | null
  sort: number
  visible: boolean
  children: NavMenuItem[]
}

const normalizeUrl = (url: string) => {
  if (!url) return url
  if (url.startsWith('/') || url.startsWith('#') || url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.match(/^[a-zA-Z0-9].*\./)) return `https://${url}`
  return url
}

export default function Header() {
  const router = useRouter()
  const { theme, toggleTheme, themeColor, setThemeColor } = useTheme()
  const { language, toggleLanguage, t } = useLanguage()
  const [user, setUser] = useState<{ username: string; role: string; permissions?: string[] } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [navMenus, setNavMenus] = useState<NavMenuItem[]>([])
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([])
  const [showColorPicker, setShowColorPicker] = useState(false)
  const siteSettings = useSiteSettings()

  const defaultNav = [
    { href: '/', label: t('首页') },
    ...categories.map(c => ({ href: `/category/${c.slug}`, label: c.name })),
    { href: '/search', label: t('信息查询') },
  ]

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
      // Sync latest role & permissions from server
      fetch('/api/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.role) {
            const updated = { ...JSON.parse(userData), role: data.role, permissions: data.permissions || [] }
            localStorage.setItem('user', JSON.stringify(updated))
            setUser(updated)
          }
        })
        .catch(() => {})
    }
    fetchNavMenus()
    fetch('/api/categories').then(r => r.json()).then(data => { if (Array.isArray(data)) setCategories(data) }).catch(() => {})
  }, [])

  const fetchNavMenus = async () => {
    try {
      const res = await fetch('/api/nav-menus')
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) setNavMenus(data)
      }
    } catch { /* use default nav */ }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50">
      {/* Top Utility Bar */}
      <div className="bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center text-xs h-8">
          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
            <span>{siteSettings.site_name}</span>
            {siteSettings.site_hotline && <span className="flex items-center gap-1"><Phone size={11} />{t('客服热线：')}{siteSettings.site_hotline}</span>}
          </div>
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <div className="relative">
              <button onClick={() => setShowColorPicker(!showColorPicker)} className="flex items-center gap-1 hover:text-bank-red transition-colors" title={t('切换主题色')}>
                <Palette size={12} />
                <span className="w-2.5 h-2.5 rounded-full ring-1 ring-gray-300 dark:ring-gray-500" style={{ background: THEME_PRESETS.find(p => p.key === themeColor)?.red || '#c4161c' }} />
                <span className="hidden sm:inline">{t('颜色')}</span>
              </button>
              {showColorPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-3 z-50 w-[280px] animate-[fadeIn_0.15s_ease-out]">
                    <p className="text-[10px] text-gray-400 mb-2 font-medium">{t('选择主题配色')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {THEME_PRESETS.map(preset => {
                        const active = themeColor === preset.key
                        return (
                          <button key={preset.key} type="button"
                            onClick={() => { setThemeColor(preset.key); setShowColorPicker(false) }}
                            className={`relative flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                              active ? 'border-gray-800 dark:border-white bg-gray-50 dark:bg-gray-700 shadow-sm' : 'border-gray-100 dark:border-gray-600 hover:border-gray-300'
                            }`}>
                            <div className="flex gap-0.5 shrink-0">
                              <span className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10" style={{ background: preset.primary }} />
                              <span className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10" style={{ background: preset.red }} />
                              <span className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10" style={{ background: preset.accent }} />
                            </div>
                            <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">{translateText(preset.label, language)}</span>
                            {active && <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-500 text-white text-[7px] flex items-center justify-center">✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button onClick={toggleTheme} className="flex items-center gap-1 hover:text-bank-red transition-colors" title={theme === 'dark' ? t('切换亮色模式') : t('切换暗色模式')}>
              {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
              <span className="hidden sm:inline">{theme === 'dark' ? t('亮色') : t('暗色')}</span>
            </button>
            <button onClick={toggleLanguage} className="flex items-center gap-1 hover:text-bank-red transition-colors" title={t('切换语言')}>
              <Languages size={12} />
              <span className="hidden sm:inline">{language === 'zh-CN' ? 'EN' : '中文'}</span>
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            {user ? (
              <>
                {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (user.role === 'SUPER_ADMIN' || (user.permissions || []).includes('publish') || (user.permissions || []).some(p => p.startsWith('publish:'))) && (
                  <>
                    <Link href="/post/create" className="flex items-center gap-1 hover:text-bank-red transition-colors">
                      <PenSquare size={12} />{t('发布文章')}
                    </Link>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                  </>
                )}
                <Link href="/profile" className="flex items-center gap-1 hover:text-bank-red transition-colors">
                  <User size={12} />{user.username}
                </Link>
                {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <Link href="/admin" className="flex items-center gap-1 hover:text-bank-red transition-colors">
                      <Settings size={12} />{t('管理中心')}
                    </Link>
                  </>
                )}
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button onClick={handleLogout} className="flex items-center gap-1 hover:text-bank-red transition-colors">
                  <LogOut size={12} />{t('退出')}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-bank-red transition-colors">{t('登录')}</Link>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <Link href="/register" className="hover:text-bank-red transition-colors">{t('注册')}</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Logo + Search Bar */}
      <div className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-bank-red rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-black">{siteSettings.site_logo_text}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-bank-red tracking-wider">{siteSettings.site_short_name}</h1>
              <p className="text-xs text-gray-400 tracking-widest">{siteSettings.site_logo_subtitle}</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <form onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`) }} className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-56 px-3 py-1.5 border border-gray-300 rounded-l text-sm focus:outline-none focus:border-bank-red dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                placeholder={t('搜索文章...')}
              />
              <button type="submit" className="bg-bank-red text-white px-4 py-1.5 rounded-r text-sm hover:bg-bank-redDark transition-colors">
                <Search size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-bank-primary shadow-md border-t border-white/10">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center flex-1">
              {(navMenus.length > 0 ? navMenus : []).map((menu, idx) => (
                <div
                  key={menu.id}
                  className="relative"
                  onMouseEnter={() => menu.children.length > 0 && setOpenDropdown(menu.id)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  {menu.url ? (
                    <Link
                      href={normalizeUrl(menu.url)}
                      data-no-translate
                      target={menu.url.startsWith('http') || menu.url.match(/^[a-zA-Z0-9].*\./) ? '_blank' : undefined}
                      rel={menu.url.startsWith('http') || menu.url.match(/^[a-zA-Z0-9].*\./) ? 'noopener noreferrer' : undefined}
                      className={`text-white text-[13px] font-bold px-5 py-2.5 flex items-center gap-0.5 transition-colors whitespace-nowrap ${idx === 0 ? 'bg-white/20' : 'hover:bg-white/15'} ${menu.name === '专栏' ? 'bg-white/25' : ''}`}
                    >
                      {menu.name}
                      {menu.children.length > 0 && <span className="text-[10px] ml-0.5 opacity-70">▼</span>}
                    </Link>
                  ) : (
                    <button
                      data-no-translate
                      className="text-white text-[13px] font-bold px-5 py-2.5 flex items-center gap-0.5 hover:bg-white/15 transition-colors whitespace-nowrap"
                    >
                      {menu.name}
                      {menu.children.length > 0 && <span className="text-[10px] ml-0.5 opacity-70">▼</span>}
                    </button>
                  )}
                  {/* Dropdown */}
                  {menu.children.length > 0 && openDropdown === menu.id && (
                    <div className="absolute top-full left-0 bg-white dark:bg-gray-800 shadow-2xl rounded-b-lg min-w-[230px] max-h-[440px] overflow-y-auto z-50 animate-[fadeIn_0.15s_ease-out]" style={{ borderTop: `3px solid rgb(var(--theme-primary-rgb, 26 58 107))` }}>
                      {menu.children.map((child, ci) => (
                        child.url ? (
                          <a
                            key={child.id}
                            href={normalizeUrl(child.url)}
                            data-no-translate
                            target={child.url.startsWith('http') || child.url.match(/^[a-zA-Z0-9].*\./) ? '_blank' : '_self'}
                            rel={child.url.startsWith('http') || child.url.match(/^[a-zA-Z0-9].*\./) ? 'noopener noreferrer' : undefined}
                            className="group flex items-center gap-2 px-4 py-2.5 text-[13px] text-gray-600 dark:text-gray-300 hover:bg-bank-primary hover:text-white dark:hover:bg-gray-700 transition-all duration-150 border-b border-gray-100/80 dark:border-gray-700 last:border-b-0"
                          >
                            <span className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-white flex-shrink-0 transition-colors" />
                            {child.name}
                          </a>
                        ) : (
                          <span key={child.id} data-no-translate className="block px-4 py-2.5 text-[13px] text-gray-400">{child.name}</span>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {navMenus.length === 0 && defaultNav.map((item, idx) => (
                <Link
                  key={item.href}
                  href={item.href}
                  data-no-translate
                  className={`text-white text-[13px] font-bold px-5 py-2.5 hover:bg-white/15 transition-colors whitespace-nowrap ${idx === 0 ? 'bg-white/20' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Quick Nav Button */}
            <Link href="/search" className="hidden md:flex items-center gap-1 text-white text-[12px] font-bold px-3 py-1.5 rounded bg-white/15 hover:bg-white/25 transition-colors whitespace-nowrap ml-2">
              <Search size={12} />{t('快捷导航')}
            </Link>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-white py-3" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile Nav */}
          {menuOpen && (
            <nav className="md:hidden pb-3 border-t border-white/20">
              {(navMenus.length > 0 ? navMenus : defaultNav.map((n, i) => ({ id: i, name: n.label, url: n.href, children: [] as NavMenuItem[] }))).map(menu => (
                <div key={menu.id}>
                  {menu.url ? (
                    <Link key={menu.id} href={normalizeUrl(menu.url || '#')} data-no-translate
                      className="block py-2 text-white text-sm hover:bg-white/10 px-2 rounded">
                      {menu.name}
                    </Link>
                  ) : (
                    <span className="block py-2 text-white/80 text-sm font-bold px-2">{menu.name}</span>
                  )}
                  {menu.children.map(child => (
                    child.url ? (
                      <Link key={child.id} href={normalizeUrl(child.url || '#')} data-no-translate
                        target={child.url.startsWith('http') || child.url.match(/^[a-zA-Z0-9].*\./) ? '_blank' : '_self'}
                        className="block py-1.5 pl-6 text-white/70 text-xs hover:text-white hover:bg-white/10 rounded">
                        {child.name}
                      </Link>
                    ) : null
                  ))}
                </div>
              ))}
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
