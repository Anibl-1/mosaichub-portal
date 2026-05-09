'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Clock, Eye, User, TrendingUp, ArrowRight, Home, Tag } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import { formatLocaleDate } from '@/lib/i18n'

interface Post {
  id: number
  title: string
  summary: string | null
  coverImage: string | null
  viewCount: number
  createdAt: string
  category: { name: string; slug: string }
  author: { username: string }
}

const sidebarColors = ['text-red-600', 'text-amber-600', 'text-blue-700', 'text-blue-500', 'text-emerald-600', 'text-violet-600']

const fallbackGradients = [
  'linear-gradient(135deg, #1a3a6b 0%, #2563eb 100%)',
  'linear-gradient(135deg, #c4161c 0%, #e8811a 100%)',
  'linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 100%)',
  'linear-gradient(135deg, #d4a530 0%, #e8811a 100%)',
]

export default function SearchPage() {
  const { t } = useLanguage()
  return (
    <Suspense fallback={<div className="max-w-[1200px] mx-auto px-4 py-12 text-center text-gray-400 text-sm">{t('加载中...')}</div>}>
      <SearchPageContent />
    </Suspense>
  )
}

function SearchPageContent() {
  const { language, t } = useLanguage()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(urlQuery)
  const [results, setResults] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([])

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {})
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.posts || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (urlQuery) {
      setQuery(urlQuery)
      doSearch(urlQuery)
    }
  }, [urlQuery, doSearch])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(query)
  }

  const handleQuickSearch = (term: string) => {
    setQuery(term)
    doSearch(term)
  }

  const fmtDate = (d: string) => formatLocaleDate(d, language, { year: 'numeric', month: '2-digit', day: '2-digit' })

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/" className="hover:text-bank-red flex items-center gap-1"><Home size={11} />{t('首页')}</Link>
        <span>&gt;</span>
        <span className="text-gray-700 dark:text-gray-300">{t('信息查询')}</span>
      </div>

      {/* Search Hero */}
      <div className="card mb-5 overflow-hidden">
        <div className="bg-bank-primary p-6 md:p-8">
          <h1 className="text-2xl font-bold text-white mb-1">{t('信息查询')}</h1>
          <p className="text-white/60 text-sm mb-5">{language === 'en' ? 'Search all public posts, notices and news in the portal' : '搜索门户所有公开文章、通知和新闻'}</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-0 rounded-lg text-sm focus:ring-2 focus:ring-white/50 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 shadow-lg"
                placeholder={t('输入关键词搜索文章...')}
              />
            </div>
            <button type="submit" className="bg-bank-red hover:bg-bank-redDark text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-lg" disabled={loading}>
              {loading ? t('搜索中...') : t('搜索')}
            </button>
          </form>
          {/* Hot topics */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-white/50 text-xs flex items-center gap-1"><TrendingUp size={11} />{t('热搜：')}</span>
            {categories.map(cat => (
              <button key={cat.slug} onClick={() => handleQuickSearch(cat.name)}
                className="text-[11px] text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full transition-colors">
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Results */}
        <div className="lg:col-span-8">
          {searched && (
            <div className="card">
              <div className="section-header">
                <span className="text-sm font-bold">{t('搜索结果')}</span>
                <span className="text-[10px] text-gray-300">
                  {loading ? t('搜索中...') : (language === 'en' ? `${total} results found` : `找到 ${total} 条结果`)}
                </span>
              </div>
              {loading ? (
                <div className="p-6 space-y-5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex gap-4">
                      <div className="w-28 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-full"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {results.map((post, idx) => (
                    <Link key={post.id} href={`/post/${post.id}`}
                      className="flex gap-4 p-4 md:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                      <div className="w-28 h-20 rounded-lg overflow-hidden flex-shrink-0 hidden sm:block">
                        {post.coverImage ? (
                          <img src={post.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/60 text-[10px] font-bold"
                            style={{ background: fallbackGradients[idx % fallbackGradients.length] }}>
                            <span className="text-center px-1 line-clamp-2">{post.title.slice(0, 6)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] bg-bank-primary/10 text-bank-primary dark:bg-bank-primary/20 dark:text-blue-300 px-2 py-0.5 rounded">{post.category.name}</span>
                        </div>
                        <h3 className="text-base font-medium text-gray-800 dark:text-gray-100 group-hover:text-bank-red transition-colors line-clamp-1 mb-1">
                          {post.title}
                        </h3>
                        {post.summary && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{post.summary}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1.5">
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
                    <Search size={24} className="text-gray-300 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-400 mb-1">{t('未找到相关内容')}</p>
                  <p className="text-xs text-gray-300 dark:text-gray-500">{t('请尝试更换关键词或使用热搜词条')}</p>
                </div>
              )}
            </div>
          )}

          {!searched && (
            <div className="card">
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Search size={32} className="text-gray-300 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">{t('输入关键词开始搜索')}</p>
                <p className="text-xs text-gray-300 dark:text-gray-500">{t('支持搜索文章标题、内容和摘要')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Category Shortcuts */}
          <div className="card">
            <div className="section-header-red">
              <span className="text-sm font-bold">{t('分类浏览')}</span>
            </div>
            <div className="p-3 space-y-1">
              {categories.map((cat, i) => (
                <Link key={cat.slug} href={`/category/${cat.slug}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                  <span className="flex items-center gap-2">
                    <Tag size={12} className={sidebarColors[i % sidebarColors.length]} />{cat.name}
                  </span>
                  <ArrowRight size={12} className="text-gray-300 group-hover:text-bank-red transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Search Tips */}
          <div className="card p-4">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">{t('搜索技巧')}</h3>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 bg-bank-red/10 text-bank-red rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
                {t('使用精确关键词可以获得更准确的结果')}
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 bg-bank-red/10 text-bank-red rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
                {t('可以搜索文章标题、正文或摘要内容')}
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 bg-bank-red/10 text-bank-red rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
                {t('使用热搜词条可快速浏览热门话题')}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
