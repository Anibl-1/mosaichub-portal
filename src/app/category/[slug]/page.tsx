'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, Eye, ChevronLeft, ChevronRight, ArrowLeft, User, Layers, FolderOpen, Bell, Newspaper, Home, ExternalLink } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import { formatLocaleDate } from '@/lib/i18n'

interface Post {
  id: number
  title: string
  summary: string | null
  coverImage: string | null
  viewCount: number
  isTop: boolean
  createdAt: string
  author: { username: string }
}

const defaultGradients = [
  'from-bank-red to-red-800',
  'from-amber-500 to-orange-600',
  'from-bank-primary to-bank-dark',
  'from-blue-600 to-indigo-800',
  'from-emerald-500 to-emerald-700',
  'from-violet-500 to-violet-700',
]
const defaultIcons = ['Layers', 'FolderOpen', 'Bell', 'Newspaper', 'Layers', 'FolderOpen']

const iconMap: Record<string, React.ReactNode> = {
  Layers: <Layers size={36} className="text-white" />,
  FolderOpen: <FolderOpen size={36} className="text-white" />,
  Bell: <Bell size={36} className="text-white" />,
  Newspaper: <Newspaper size={36} className="text-white" />,
}

const fallbackGradients = [
  'linear-gradient(135deg, #1a3a6b 0%, #2563eb 100%)',
  'linear-gradient(135deg, #c4161c 0%, #e8811a 100%)',
  'linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 100%)',
  'linear-gradient(135deg, #d4a530 0%, #e8811a 100%)',
]

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const { language, t } = useLanguage()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string; description: string }[]>([])

  const decodedSlug = decodeURIComponent(params.slug)
  const catIdx = categories.findIndex(c => c.slug === decodedSlug)
  const curCat = categories.find(c => c.slug === decodedSlug)
  const meta = {
    name: curCat?.name || decodedSlug,
    desc: curCat?.description || '',
    icon: defaultIcons[catIdx >= 0 ? catIdx % defaultIcons.length : 0],
    gradient: defaultGradients[catIdx >= 0 ? catIdx % defaultGradients.length : 0],
  }

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [page])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/posts?category=${encodeURIComponent(decodedSlug)}&page=${page}&limit=10`)
      const data = await res.json()
      setPosts(data.posts || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fmtDate = (d: string) => formatLocaleDate(d, language, { year: 'numeric', month: '2-digit', day: '2-digit' })

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/" className="hover:text-bank-red flex items-center gap-1"><Home size={11} />{t('首页')}</Link>
        <span>&gt;</span>
        <span className="text-gray-700 dark:text-gray-300">{meta.name}</span>
      </div>

      {/* Hero Header */}
      <div className="card mb-5 overflow-hidden">
        <div className={`bg-gradient-to-r ${meta.gradient} p-6 md:p-8`}>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
              {iconMap[meta.icon]}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{meta.name}</h1>
              <p className="text-white/70 text-sm mt-1.5 max-w-2xl leading-relaxed">{meta.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
            <span className="text-white/60 text-xs">{language === 'en' ? `${total} posts in total` : `共 ${total} 篇文章`}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/60 text-xs">{language === 'en' ? `Page ${page} of ${totalPages}` : `第 ${page}/${totalPages} 页`}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Content */}
        <div className="lg:col-span-8">
          <div className="card">
            <div className="section-header">
              <span className="text-sm font-bold">{t('文章列表')}</span>
              <span className="text-[10px] text-gray-300">{language === 'en' ? `${total} posts` : `${total} 篇`}</span>
            </div>
            {loading ? (
              <div className="p-6 space-y-5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse flex gap-4">
                    <div className="w-36 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-full"></div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {posts.map((post, idx) => (
                  <Link key={post.id} href={`/post/${post.id}`} className="flex gap-4 p-4 md:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                    {/* Thumbnail */}
                    <div className="w-36 h-24 rounded-lg overflow-hidden flex-shrink-0 hidden sm:block">
                      {post.coverImage ? (
                        <img src={post.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/60 text-xs font-bold"
                          style={{ background: fallbackGradients[idx % fallbackGradients.length] }}>
                          <span className="text-center px-2 line-clamp-2">{post.title.slice(0, 8)}</span>
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {post.isTop && <span className="text-[9px] bg-bank-red text-white px-1.5 py-0.5 rounded">{t('置顶')}</span>}
                          <h3 className="text-base font-medium text-gray-800 dark:text-gray-100 group-hover:text-bank-red transition-colors line-clamp-1">
                            {post.title}
                          </h3>
                        </div>
                        {post.summary && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">{post.summary}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                        <span className="flex items-center gap-1"><User size={11} />{post.author.username}</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{fmtDate(post.createdAt)}</span>
                        <span className="flex items-center gap-1"><Eye size={11} />{post.viewCount}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Newspaper size={24} className="text-gray-300 dark:text-gray-500" />
                </div>
                <p className="text-gray-400">{t('该分类下暂无内容')}</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 p-4 border-t dark:border-gray-700">
                <button onClick={() => setPage(1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border dark:border-gray-600 text-xs disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{t('首页')}</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border dark:border-gray-600 text-sm disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                  const p = start + i
                  if (p > totalPages) return null
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-bank-red text-white' : 'border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {p}
                    </button>
                  )
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border dark:border-gray-600 text-sm disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <ChevronRight size={14} />
                </button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border dark:border-gray-600 text-xs disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{language === 'en' ? 'Last' : '末页'}</button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Category Navigation */}
          <div className="card">
            <div className="section-header-red">
              <span className="text-sm font-bold">{t('栏目导航')}</span>
            </div>
            <div className="p-3 space-y-1">
              {categories.map(cat => (
                <Link key={cat.slug} href={`/category/${cat.slug}`}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${cat.slug === decodedSlug ? 'bg-bank-red/10 text-bank-red font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cat.slug === decodedSlug ? 'bg-bank-red' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links - dynamically from categories */}
          <div className="card">
            <div className="section-header">
              <span className="text-sm font-bold">{t('快捷服务')}</span>
            </div>
            <div className="p-3 space-y-1.5">
              {categories.filter(c => c.slug !== decodedSlug).slice(0, 4).map(c => (
                <Link key={c.slug} href={`/category/${c.slug}`} className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-bank-red transition-colors">
                  <span className="flex items-center gap-2"><FolderOpen size={14} />{c.name}</span>
                  <ExternalLink size={11} className="text-gray-300" />
                </Link>
              ))}
              <Link href="/post/create" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 transition-colors">
                <Newspaper size={14} />{t('发布文章')}
              </Link>
            </div>
          </div>

          {/* Tips */}
          <div className="card p-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              <strong className="text-gray-600 dark:text-gray-400">{t('温馨提示：')}</strong>{t('可通过导航栏快速切换各栏目，或使用页面两侧悬浮按钮进入对应功能。')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
