'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import SafeHtml from '@/components/SafeHtml'
import { useLanguage } from '@/components/LanguageProvider'
import { formatLocaleDate, translateText } from '@/lib/i18n'

interface Post {
  id: number
  title: string
  summary: string | null
  viewCount: number
  isTop: boolean
  coverImage: string | null
  createdAt: string
  category: { name: string; slug: string }
  author: { username: string }
}

interface HomeModule {
  id: string
  type: 'banner' | 'category_list' | 'image_grid' | 'top_headline' | 'latest_covers' | 'news_feed' | 'quick_links' | 'custom'
  title: string
  category?: string
  width: 'full' | 'half' | 'third' | 'two-thirds'
  sort: number
  visible: boolean
  config?: Record<string, string | number | boolean>
}

interface HomeCat { id: number; name: string; slug: string; description: string }

const fallbackGradients = [
  'linear-gradient(135deg, #1a3a6b 0%, #2563eb 100%)',
  'linear-gradient(135deg, #c4161c 0%, #e8811a 100%)',
  'linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 100%)',
  'linear-gradient(135deg, #d4a530 0%, #e8811a 100%)',
  'linear-gradient(135deg, #2563eb 0%, #1a3a6b 100%)',
  'linear-gradient(135deg, #3a3a3a 0%, #1a3a6b 100%)',
]

const defaultModules: HomeModule[] = [
  { id: 'banner', type: 'banner', title: '轮播横幅', width: 'two-thirds', sort: 1, visible: true },
  { id: 'headline', type: 'top_headline', title: '今日头条', width: 'third', sort: 2, visible: true },
  { id: 'hot_images', type: 'image_grid', title: '热点图片', width: 'third', sort: 3, visible: true },
  { id: 'quick_links', type: 'quick_links', title: '快捷导航', width: 'full', sort: 4, visible: true },
  { id: 'cat1', type: 'category_list', title: '', category: 'feedback', width: 'half', sort: 5, visible: true, config: { limit: 8, tabWith: 'suggestions' } },
  { id: 'cat2', type: 'category_list', title: '', category: 'notice', width: 'half', sort: 6, visible: true, config: { limit: 8, tabWith: 'news' } },
  { id: 'news_feed', type: 'news_feed', title: '综合快讯', width: 'full', sort: 7, visible: true, config: { limit: 8 } },
  { id: 'latest', type: 'latest_covers', title: '最新发布', width: 'full', sort: 8, visible: true, config: { limit: 5 } },
]

/* ========== Sub-components ========== */

function BannerModule({ posts }: { posts: Post[] }) {
  const { t } = useLanguage()
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (posts.length <= 1) return
    const t = setInterval(() => setIdx(p => (p + 1) % posts.length), 5000)
    return () => clearInterval(t)
  }, [posts])
  const cur = posts[idx]
  if (!cur) return <div className="h-full flex items-center justify-center bg-gradient-to-br from-bank-primary to-bank-dark"><p className="text-white/50 text-sm">{t('暂无置顶内容')}</p></div>
  return (
    <>
      <Link href={`/post/${cur.id}`} className="block h-full">
        {cur.coverImage ? <img src={cur.coverImage} alt={cur.title} className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0" style={{ background: fallbackGradients[idx % fallbackGradients.length] }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <span className="inline-block text-[10px] bg-bank-red text-white px-2 py-0.5 rounded mb-2">{cur.category?.name || t('推荐')}</span>
          <h3 className="text-white font-bold text-lg leading-tight mb-1.5">{cur.title}</h3>
          {cur.summary && <p className="text-gray-300 text-xs line-clamp-2 leading-relaxed">{cur.summary}</p>}
        </div>
      </Link>
      <div className="absolute bottom-2.5 right-3 flex gap-1.5 z-10">
        {posts.map((_, i) => <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-5' : 'bg-white/40 w-1.5'}`} />)}
      </div>
      <button onClick={() => setIdx(p => p === 0 ? posts.length - 1 : p - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors"><ChevronLeft size={16} /></button>
      <button onClick={() => setIdx(p => (p + 1) % posts.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors"><ChevronRight size={16} /></button>
    </>
  )
}

function HeadlineModule({ posts, title }: { posts: Post[]; title: string }) {
  const { t, language } = useLanguage()
  return (
    <div className="card h-full">
      <div className="section-header-red">
        <span className="text-sm font-bold">{translateText(title, language)}</span>
      </div>
      {posts.length > 0 ? (
        <div className="p-4">
          <Link href={`/post/${posts[0].id}`} className="block group">
            <h3 className="text-sm font-bold text-bank-red group-hover:underline mb-1">{posts[0].title}</h3>
            {posts[0].summary && <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{posts[0].summary}</p>}
          </Link>
        </div>
      ) : <div className="p-4 text-center text-gray-400 text-xs">{t('暂无内容')}</div>}
    </div>
  )
}

function ImageGridModule({ posts, title, wide }: { posts: Post[]; title: string; wide?: boolean }) {
  const { language } = useLanguage()
  const count = wide ? 8 : 4
  const items = posts.filter(p => p.coverImage).slice(0, count)
    .concat(posts.filter(p => !p.coverImage).slice(0, Math.max(0, count - posts.filter(p => p.coverImage).length)))
    .slice(0, count)
  return (
    <div className="card h-full flex flex-col">
      <div className="section-header"><span className="text-sm font-bold">{translateText(title, language)}</span></div>
      <div className="p-2.5 flex-1">
        <div className={`grid ${wide ? 'grid-cols-4' : 'grid-cols-2'} gap-2.5`}>
          {items.map((post, idx) => (
            <Link key={post.id} href={`/post/${post.id}`} className="group overflow-hidden">
              <div className={`relative ${wide ? 'h-36' : 'h-24'} rounded overflow-hidden`}>
                {post.coverImage ? <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  : <div className="w-full h-full flex items-center justify-center text-white/70 text-xs font-bold transition-transform duration-300 group-hover:scale-110" style={{ background: fallbackGradients[idx % fallbackGradients.length] }}><span className="text-center px-2 line-clamp-2">{post.title.slice(0, 8)}</span></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-1 left-1.5 right-1.5 text-[10px] text-white line-clamp-1 font-medium">{post.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function CategoryListModule({ mod, catPosts, cats, fmtShort }: { mod: HomeModule; catPosts: Record<string, Post[]>; cats: HomeCat[]; fmtShort: (d: string) => string }) {
  const { t, language } = useLanguage()
  const tabWith = (mod.config?.tabWith as string) || ''
  const slugs = [mod.category || '', tabWith].filter(Boolean)
  const [active, setActive] = useState(slugs[0] || '')
  const catName = (slug: string) => cats.find(c => c.slug === slug)?.name || slug
  const limit = (mod.config?.limit as number) || 8
  const layout = (mod.config?.layout as string) || 'default'
  const posts = active ? (catPosts[active] || []) : []
  const display = posts.slice(0, limit)

  const renderList = () => {
    if (display.length === 0) return <p className="text-gray-400 text-center py-6 text-xs">{t('暂无内容')}</p>

    if (layout === 'card') {
      return (
        <div className="grid grid-cols-2 gap-2.5">
          {display.map((post, idx) => (
            <Link key={post.id} href={`/post/${post.id}`} className="group block rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="h-24 relative overflow-hidden">
                {post.coverImage ? <img src={post.coverImage} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-white/70 text-xs font-bold" style={{ background: fallbackGradients[idx % fallbackGradients.length] }}><span className="text-center px-2 line-clamp-1">{post.title.slice(0, 6)}</span></div>}
              </div>
              <div className="p-2">
                <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium line-clamp-2 leading-tight group-hover:text-bank-red transition-colors">{post.title}</p>
                <span className="text-[9px] text-gray-400 mt-1 block">{fmtShort(post.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )
    }

    if (layout === 'image_left') {
      return (
        <div className="space-y-2">
          {display.map((post, idx) => (
            <Link key={post.id} href={`/post/${post.id}`} className="flex gap-2.5 group">
              <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0">
                {post.coverImage ? <img src={post.coverImage} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-[9px] text-white/70 font-bold" style={{ background: fallbackGradients[idx % fallbackGradients.length] }}>{post.title.slice(0, 4)}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-bank-red transition-colors line-clamp-2 leading-snug font-medium">{post.title}</p>
                <span className="text-[10px] text-gray-400 mt-0.5 block">{fmtShort(post.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )
    }

    if (layout === 'headline' && display.length > 0) {
      const first = display[0]
      const rest = display.slice(1)
      return (
        <div className="space-y-2">
          <Link href={`/post/${first.id}`} className="block group rounded-lg overflow-hidden">
            <div className="h-36 relative overflow-hidden">
              {first.coverImage ? <img src={first.coverImage} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                : <div className="w-full h-full flex items-center justify-center text-white/70 font-bold" style={{ background: fallbackGradients[0] }}><span className="text-center px-4">{first.title.slice(0, 12)}</span></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <p className="text-sm text-white font-bold line-clamp-2 leading-snug drop-shadow">{first.title}</p>
                <span className="text-[10px] text-white/70 mt-0.5 block">{fmtShort(first.createdAt)}</span>
              </div>
            </div>
          </Link>
          {rest.length > 0 && (
            <ul>{rest.map(post => (
              <li key={post.id} className="news-item">
                <span className="news-dot" />
                <Link href={`/post/${post.id}`} className="news-link flex-1">{post.title}</Link>
                <span className="news-date">{fmtShort(post.createdAt)}</span>
              </li>
            ))}</ul>
          )}
        </div>
      )
    }

    return (
      <ul>{display.map(post => (
        <li key={post.id} className="news-item">
          <span className="news-dot" />
          <Link href={`/post/${post.id}`} className="news-link flex-1">{post.title}</Link>
          <span className="news-date">{fmtShort(post.createdAt)}</span>
        </li>
      ))}</ul>
    )
  }

  return (
    <div className="card flex flex-col h-full">
      {slugs.length > 0 ? (
        <div className="section-header">
          <div className="flex items-center gap-1">
            {slugs.map((s, i) => (
              <span key={s} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-500 text-xs">|</span>}
                <button onClick={() => setActive(s)} className={`section-tab ${active === s ? 'section-tab-active' : 'section-tab-inactive'}`}>{catName(s)}</button>
              </span>
            ))}
          </div>
          <Link href={`/category/${active}`} className="text-[10px] text-gray-300 hover:text-white flex items-center gap-0.5">{t('更多')}<ChevronRight size={10} /></Link>
        </div>
      ) : (
        <div className="section-header">
          <span className="text-sm font-bold">{translateText(mod.title || '分类文章', language)}</span>
        </div>
      )}
      <div className="p-3 flex-1">
        {slugs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">{t('请在管理后台编辑此模块，选择要展示的分类')}</p>
          </div>
        ) : renderList()}
      </div>
    </div>
  )
}

function NewsFeedModule({ posts, title, layout, fmtShort, wide }: { posts: Post[]; title: string; layout: string; fmtShort: (d: string) => string; wide?: boolean }) {
  const { t, language } = useLanguage()
  const renderContent = () => {
    if (posts.length === 0) return <p className="text-gray-400 text-center py-4 text-xs">{t('暂无内容')}</p>

    if (layout === 'card') {
      return (
        <div className={`grid ${wide ? 'grid-cols-3 md:grid-cols-4' : 'grid-cols-2'} gap-2.5`}>
          {posts.map((post, idx) => (
            <Link key={post.id} href={`/post/${post.id}`} className="group block rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className={`${wide ? 'h-28' : 'h-20'} relative overflow-hidden`}>
                {post.coverImage ? <img src={post.coverImage} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-white/70 text-xs font-bold" style={{ background: fallbackGradients[idx % fallbackGradients.length] }}><span className="text-center px-2 line-clamp-1">{post.title.slice(0, 6)}</span></div>}
              </div>
              <div className="p-2">
                <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium line-clamp-2 leading-tight group-hover:text-bank-red transition-colors">{post.title}</p>
                <span className="text-[9px] text-gray-400 mt-1 block">{fmtShort(post.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )
    }

    if (layout === 'image_left') {
      return (
        <div className="space-y-2">
          {posts.map((post, idx) => (
            <Link key={post.id} href={`/post/${post.id}`} className="flex gap-2.5 group">
              <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0">
                {post.coverImage ? <img src={post.coverImage} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-[9px] text-white/70 font-bold" style={{ background: fallbackGradients[idx % fallbackGradients.length] }}>{post.title.slice(0, 4)}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-bank-red transition-colors line-clamp-2 leading-snug font-medium">{post.title}</p>
                <span className="text-[10px] text-gray-400 mt-0.5 block">{fmtShort(post.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )
    }

    if (layout === 'headline' && posts.length > 0) {
      const first = posts[0]
      const rest = posts.slice(1)
      return (
        <div className="space-y-2">
          <Link href={`/post/${first.id}`} className="block group rounded-lg overflow-hidden">
            <div className="h-32 relative overflow-hidden">
              {first.coverImage ? <img src={first.coverImage} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                : <div className="w-full h-full flex items-center justify-center text-white/70 font-bold" style={{ background: fallbackGradients[0] }}><span className="text-center px-4">{first.title.slice(0, 12)}</span></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <p className="text-sm text-white font-bold line-clamp-2 leading-snug drop-shadow">{first.title}</p>
              </div>
            </div>
          </Link>
          {rest.length > 0 && (
            <ul>{rest.map(post => (
              <li key={post.id} className="news-item">
                <span className="news-dot" />
                <Link href={`/post/${post.id}`} className="news-link flex-1 text-xs">{post.title}</Link>
                <span className="news-date text-[10px]">{fmtShort(post.createdAt)}</span>
              </li>
            ))}</ul>
          )}
        </div>
      )
    }

    return (
      <ul>{posts.map(post => (
        <li key={post.id} className="news-item">
          <span className="news-dot" />
          <Link href={`/post/${post.id}`} className="news-link flex-1 text-xs">{post.title}</Link>
          <span className="news-date text-[10px]">{fmtShort(post.createdAt)}</span>
        </li>
      ))}</ul>
    )
  }

  return (
    <div className="card">
      <div className="section-header-red"><span className="text-sm font-bold">{translateText(title, language)}</span></div>
      <div className="p-3">{renderContent()}</div>
    </div>
  )
}

function LatestCoversModule({ posts, title, layout, fmtDate, fmtShort, wide }: { posts: Post[]; title: string; layout: string; fmtDate: (d: string) => string; fmtShort: (d: string) => string; wide?: boolean }) {
  const { t, language } = useLanguage()
  const renderContent = () => {
    if (posts.length === 0) return <p className="text-gray-400 text-center py-4 text-xs">{t('暂无内容')}</p>

    if (layout === 'card') {
      return (
        <div className={`grid ${wide ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-2'} gap-2.5`}>
          {posts.map((post, idx) => (
            <Link key={post.id} href={`/post/${post.id}`} className="group block rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className={`${wide ? 'h-32' : 'h-24'} relative overflow-hidden`}>
                {post.coverImage ? <img src={post.coverImage} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-white/70 text-xs font-bold" style={{ background: fallbackGradients[idx % fallbackGradients.length] }}><span className="text-center px-2 line-clamp-1">{post.title.slice(0, 6)}</span></div>}
              </div>
              <div className="p-2">
                <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium line-clamp-2 leading-tight group-hover:text-bank-red transition-colors">{post.title}</p>
                <span className="text-[9px] text-gray-400 mt-1 block">{fmtDate(post.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )
    }

    if (layout === 'headline' && posts.length > 0) {
      const first = posts[0]
      const rest = posts.slice(1)
      return (
        <div className="space-y-2">
          <Link href={`/post/${first.id}`} className="block group rounded-lg overflow-hidden">
            <div className="h-36 relative overflow-hidden">
              {first.coverImage ? <img src={first.coverImage} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                : <div className="w-full h-full flex items-center justify-center text-white/70 font-bold" style={{ background: fallbackGradients[0] }}><span className="text-center px-4">{first.title.slice(0, 12)}</span></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <p className="text-sm text-white font-bold line-clamp-2 leading-snug drop-shadow">{first.title}</p>
                <span className="text-[10px] text-white/70 mt-0.5 block">{fmtDate(first.createdAt)}</span>
              </div>
            </div>
          </Link>
          {rest.map((post, idx) => (
            <Link key={post.id} href={`/post/${post.id}`} className="flex gap-2.5 group">
              <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0">
                {post.coverImage ? <img src={post.coverImage} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-[9px] text-white/70 font-bold" style={{ background: fallbackGradients[idx % fallbackGradients.length] }}>{post.title.slice(0, 4)}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-bank-red transition-colors line-clamp-2 leading-snug font-medium">{post.title}</p>
                <span className="text-[10px] text-gray-400 mt-1 block">{fmtDate(post.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-2.5">
        {posts.map((post, idx) => (
          <Link key={post.id} href={`/post/${post.id}`} className="flex gap-2.5 group">
            <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0">
              {post.coverImage ? <img src={post.coverImage} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300" />
                : <div className="w-full h-full flex items-center justify-center text-[9px] text-white/70 font-bold" style={{ background: fallbackGradients[idx % fallbackGradients.length] }}>{post.title.slice(0, 4)}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-bank-red transition-colors line-clamp-2 leading-snug font-medium">{post.title}</p>
              <span className="text-[10px] text-gray-400 mt-1 block">{fmtDate(post.createdAt)}</span>
            </div>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="card">
      <div className="section-header"><span className="text-sm font-bold">{translateText(title, language)}</span></div>
      <div className="p-3">{renderContent()}</div>
    </div>
  )
}

function QuickLinksModule({ cats }: { cats: HomeCat[] }) {
  const { t } = useLanguage()
  const gradients = ['from-red-600 to-red-800', 'from-amber-500 to-orange-600', 'from-blue-800 to-blue-950', 'from-blue-500 to-blue-700', 'from-emerald-500 to-emerald-700', 'from-violet-500 to-violet-700']
  const items = cats.map((c, i) => ({
    href: `/category/${c.slug}`,
    label: c.name,
    desc: c.description || '',
    gradient: gradients[i % gradients.length],
  }))
  items.push({ href: '/search', label: t('信息查询'), desc: t('搜索文章资讯'), gradient: 'from-emerald-500 to-emerald-700' })
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {items.slice(0, 6).map((item, qi) => (
        <Link key={qi} href={item.href} className={`card group relative overflow-hidden bg-gradient-to-br ${item.gradient} hover:shadow-lg transition-all`}>
          <div className="relative p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <ChevronRight size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">{item.label}</p>
              <p className="text-[10px] text-white/60 mt-0.5">{item.desc}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

/* ========== Main page ========== */

export default function HomePage() {
  const { language } = useLanguage()
  const [cats, setCats] = useState<HomeCat[]>([])
  const [modules, setModules] = useState<HomeModule[]>([])
  const [catPosts, setCatPosts] = useState<Record<string, Post[]>>({})
  const [topPosts, setTopPosts] = useState<Post[]>([])
  const [allPosts, setAllPosts] = useState<Post[]>([])

  const fmtDate = useCallback((d: string) => formatLocaleDate(d, language, { year: 'numeric', month: '2-digit', day: '2-digit' }), [language])
  const fmtShort = useCallback((d: string) => formatLocaleDate(d, language, { month: '2-digit', day: '2-digit' }), [language])

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(r => r.json()).catch(() => []),
      fetch('/api/categories').then(r => r.json()).catch(() => []),
    ]).then(([settings, categories]) => {
      setCats(categories)
      const m: Record<string, string> = {}
      if (Array.isArray(settings)) settings.forEach((s: { key: string; value: string }) => { if (s.value) m[s.key] = s.value })

      let mods: HomeModule[] = defaultModules
      if (m.home_modules) {
        try { const parsed = JSON.parse(m.home_modules); if (Array.isArray(parsed) && parsed.length > 0) mods = parsed } catch { /* use default */ }
      }
      setModules(mods.filter(mod => mod.visible).sort((a, b) => a.sort - b.sort))

      // Collect all category slugs needed
      const slugs = new Set<string>()
      mods.forEach(mod => {
        if (mod.category) slugs.add(mod.category)
        if (mod.config?.tabWith) slugs.add(mod.config.tabWith as string)
      })

      fetchPosts(Array.from(slugs))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchPosts = async (slugs: string[]) => {
    try {
      const [top, all, ...catResults] = await Promise.all([
        fetch('/api/posts?top=true&limit=5').then(r => r.json()),
        fetch('/api/posts?limit=30').then(r => r.json()),
        ...slugs.map(s => fetch(`/api/posts?category=${s}&limit=12`).then(r => r.json())),
      ])
      setTopPosts(top.posts || [])
      setAllPosts(all.posts || [])
      const pm: Record<string, Post[]> = {}
      slugs.forEach((s, i) => { pm[s] = catResults[i].posts || [] })
      setCatPosts(pm)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    }
  }

  /* ----- Layout helpers ----- */
  const widthClass = (w: string) => {
    if (w === 'two-thirds') return 'col-span-1 lg:col-span-8'
    if (w === 'half') return 'col-span-1 lg:col-span-6'
    if (w === 'third') return 'col-span-1 lg:col-span-4'
    return 'col-span-1 lg:col-span-12'
  }
  const widthSpan = (w: string) => {
    if (w === 'two-thirds') return 8
    if (w === 'half') return 6
    if (w === 'third') return 4
    return 12
  }

  const modAnchor = (mod: HomeModule) => (mod.config?.slug as string) || mod.id

  const renderModule = (mod: HomeModule) => {
    const anchor = modAnchor(mod)
    switch (mod.type) {
      case 'banner':
        return <div key={mod.id} id={anchor} className={`${widthClass(mod.width)} card relative overflow-hidden`} style={{ minHeight: 320 }}><BannerModule posts={topPosts} /></div>
      case 'top_headline':
        return <div key={mod.id} id={anchor} className={widthClass(mod.width)}><HeadlineModule posts={topPosts} title={translateText(mod.title, language)} /></div>
      case 'image_grid':
        return <div key={mod.id} id={anchor} className={widthClass(mod.width)}><ImageGridModule posts={allPosts} title={translateText(mod.title, language)} wide={mod.width === 'full' || mod.width === 'two-thirds'} /></div>
      case 'quick_links':
        return <div key={mod.id} id={anchor} className={widthClass(mod.width)}><QuickLinksModule cats={cats} /></div>
      case 'category_list':
        return <div key={mod.id} id={anchor} className={widthClass(mod.width)}><CategoryListModule mod={mod} catPosts={catPosts} cats={cats} fmtShort={fmtShort} /></div>
      case 'news_feed':
        return <div key={mod.id} id={anchor} className={widthClass(mod.width)}><NewsFeedModule posts={allPosts.slice(0, (mod.config?.limit as number) || 8)} title={translateText(mod.title, language)} layout={(mod.config?.layout as string) || 'default'} fmtShort={fmtShort} wide={mod.width === 'full' || mod.width === 'two-thirds'} /></div>
      case 'latest_covers':
        return <div key={mod.id} id={anchor} className={widthClass(mod.width)}><LatestCoversModule posts={allPosts.slice(0, (mod.config?.limit as number) || 5)} title={translateText(mod.title, language)} layout={(mod.config?.layout as string) || 'default'} fmtDate={fmtDate} fmtShort={fmtShort} wide={mod.width === 'full' || mod.width === 'two-thirds'} /></div>
      case 'custom':
        return (
          <div key={mod.id} id={anchor} className={widthClass(mod.width)}>
            <div className="card overflow-hidden" style={{ backgroundColor: (mod.config?.bgColor as string) || undefined }}>
              {(mod.title || mod.config?.linkUrl) && (
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  {mod.title && <h3 className="font-bold text-base text-bank-dark dark:text-gray-100">{translateText(mod.title, language)}</h3>}
                  {mod.config?.linkUrl && (
                    <Link href={mod.config.linkUrl as string} className="text-xs text-gray-400 hover:text-bank-red flex items-center gap-0.5">
                      {translateText((mod.config?.linkText as string) || '查看更多', language)}<ChevronRight size={12} />
                    </Link>
                  )}
                </div>
              )}
              {mod.config?.htmlContent && (
                <div className="px-4 pb-4">
                  <SafeHtml html={mod.config.htmlContent as string} />
                </div>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {modules.map(m => renderModule(m))}
        </div>
      </div>
    </div>
  )
}
