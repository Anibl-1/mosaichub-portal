'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSiteSettings } from '@/lib/useSiteSettings'

interface NavMenuItem {
  id: number
  name: string
  url: string | null
  children: NavMenuItem[]
}

export default function Footer() {
  const s = useSiteSettings()
  const [navMenus, setNavMenus] = useState<NavMenuItem[]>([])

  useEffect(() => {
    fetch('/api/nav-menus').then(r => r.json()).then((data: NavMenuItem[]) => {
      if (data.length > 0) setNavMenus(data)
    }).catch(() => {})
  }, [])

  const footerLinks = navMenus.length > 0
    ? navMenus.map(m => ({ href: m.url || '#', label: m.name }))
    : [{ href: '/', label: '网站首页' }]

  return (
    <footer>
      <div className="bg-bank-primary dark:bg-gray-800">
        {/* Links Bar */}
        <div className="max-w-[1200px] mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-[13px]">
            {footerLinks.map((link, i) => (
              <span key={`${link.href}-${i}`} className="flex items-center">
                {i > 0 && <span className="text-white/30 mx-2">|</span>}
                <Link href={link.href} className="text-white/80 hover:text-white transition-colors px-1">
                  {link.label}
                </Link>
              </span>
            ))}
          </div>
        </div>
        {/* Copyright */}
        <div className="border-t border-white/10">
          <div className="max-w-[1200px] mx-auto px-4 py-4 text-center">
            <p className="text-xs text-white/50 leading-relaxed">
              {s.site_copyright || `${s.site_short_name} 版权所有`} &copy; {new Date().getFullYear()}
              {s.site_hotline && <>&nbsp;|&nbsp; 客服热线：{s.site_hotline}</>}
            </p>
            {s.site_icp && (
              <p className="text-[10px] text-white/30 mt-1">
                {s.site_icp} &nbsp;|&nbsp; 本网站支持IPv6
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
