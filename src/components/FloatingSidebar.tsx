'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Layers, FolderOpen, X } from 'lucide-react'

export default function FloatingSidebar() {
  const [showLeft, setShowLeft] = useState(true)
  const [showRight, setShowRight] = useState(true)
  const [showPopup, setShowPopup] = useState(false)
  const [popupImage, setPopupImage] = useState('')
  const [leftCat, setLeftCat] = useState({ slug: '', name: '', icon: '' })
  const [rightCat, setRightCat] = useState({ slug: '', name: '', icon: '' })

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(r => r.json()).catch(() => []),
      fetch('/api/categories').then(r => r.json()).catch(() => []),
    ]).then(([settings, cats]) => {
      const m: Record<string, string> = {}
      if (Array.isArray(settings)) settings.forEach((s: { key: string; value: string }) => { if (s.value) m[s.key] = s.value })
      if (m.popup_image) setPopupImage(m.popup_image)
      const leftSlug = m.sidebar_left_category || ''
      const rightSlug = m.sidebar_right_category || ''
      const findCat = (slug: string) => (cats as { name: string; slug: string }[]).find(c => c.slug === slug)
      const lc = findCat(leftSlug)
      const rc = findCat(rightSlug)
      if (lc) setLeftCat({ slug: lc.slug, name: m.sidebar_left_name || lc.name, icon: m.sidebar_left_icon || '' })
      if (rc) setRightCat({ slug: rc.slug, name: m.sidebar_right_name || rc.name, icon: m.sidebar_right_icon || '' })
    })
  }, [])

  const handleLeftClick = () => {
    if (popupImage) {
      setShowPopup(true)
    } else {
      window.location.href = `/petition?type=feedback`
    }
  }

  const leftChars = leftCat.name.split('')
  const rightLine1 = rightCat.name.length > 2 ? rightCat.name.slice(0, -2) : rightCat.name
  const rightLine2 = rightCat.name.length > 2 ? rightCat.name.slice(-2) : ''

  return (
    <>
      {/* Left sidebar */}
      {showLeft && leftCat.slug && (
        <div className="fixed left-0 top-1/3 z-50">
          <div className="relative group">
            <button onClick={handleLeftClick}
              className="block rounded-r-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:translate-x-0.5 text-left">
              {leftCat.icon ? (
                <img src={leftCat.icon} alt={leftCat.name} className="block" style={{ width: 'auto', height: 'auto', maxWidth: 80 }} />
              ) : (
                <div className="bg-gradient-to-b from-red-600 to-red-800 px-3 py-4 text-center" style={{ width: 56 }}>
                  <Layers size={22} className="text-white mx-auto mb-2" />
                  {leftChars.map((ch, i) => (
                    <div key={i} className={`text-white font-black text-sm leading-tight tracking-wider${i > 0 && i % 2 === 0 ? ' mt-0.5' : ''}`}>{ch}</div>
                  ))}
                  <div className="text-white/50 text-[7px] mt-2 border-t border-white/20 pt-1.5">查看详情</div>
                </div>
              )}
            </button>
            <button onClick={() => setShowLeft(false)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-gray-700/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-900">
              <X size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Right sidebar */}
      {showRight && rightCat.slug && (
        <div className="fixed right-0 top-1/3 z-50">
          <div className="relative group">
            <Link href={`/category/${rightCat.slug}`}
              className="block rounded-l-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-x-0.5">
              {rightCat.icon ? (
                <img src={rightCat.icon} alt={rightCat.name} className="block" style={{ width: 'auto', height: 'auto', maxWidth: 80 }} />
              ) : (
                <div className="bg-gradient-to-b from-amber-500 to-orange-700 px-2.5 py-3 text-center" style={{ width: 62 }}>
                  <FolderOpen size={20} className="text-white mx-auto mb-1.5" />
                  <div className="text-white font-black text-[10px] leading-snug">{rightLine1}</div>
                  {rightLine2 && <div className="text-white font-bold text-xs mt-1 tracking-wider">{rightLine2}</div>}
                  <div className="text-white/50 text-[7px] mt-1.5 border-t border-white/20 pt-1.5">查看详情</div>
                </div>
              )}
            </Link>
            <button onClick={() => setShowRight(false)}
              className="absolute -top-2 -left-2 w-5 h-5 bg-gray-700/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-900">
              <X size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Popup: 弹窗图片 */}
      {showPopup && popupImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPopup(false)}>
          <div className="relative max-w-3xl max-h-[90vh] mx-4 animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <img src={popupImage} alt="详情" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" />
            <button onClick={() => setShowPopup(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white text-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
