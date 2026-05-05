'use client'

import { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'

const EMOJIS = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😉','😊','😇',
  '🥰','😍','🤩','😘','😗','😚','😋','😛','😜','🤪','😝','🤗',
  '🤔','🤫','🤭','😏','😌','😔','😪','😴','😷','🤒','🥵','🥶',
  '😵','🤯','🤠','🥳','😎','🤓','🧐','😤','😠','🤬','😈','👿',
  '👍','👎','👏','🙌','🤝','👊','✊','🤞','✌️','🤟','🤙','👌',
  '💪','🙏','❤️','🧡','💛','💚','💙','💜','🖤','💔','💕','💖',
  '🔥','⭐','🎉','🎊','💯','✅','❌','⚠️','💡','💬','👀','🎯',
  '📌','📎','📝','📋','📊','💼','🏦','💰','💵','📱','💻','🔔',
]

export default function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs px-3 py-1.5 border rounded hover:border-bank-red hover:text-bank-red transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:border-bank-red dark:hover:text-bank-red">
        <Smile size={13} />表情
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-xl p-2.5 w-[296px] z-50">
          <div className="grid grid-cols-8 gap-0.5 max-h-52 overflow-y-auto scrollbar-thin">
            {EMOJIS.map((emoji, i) => (
              <button key={i} type="button" onClick={() => { onSelect(emoji); setOpen(false) }}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
