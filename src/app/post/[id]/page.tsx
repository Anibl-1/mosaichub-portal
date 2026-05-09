'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Clock, Eye, User, MessageSquare, ArrowLeft, Send, ImagePlus, Paperclip, X, ChevronDown, ChevronUp, Reply, Star, ThumbsUp, ThumbsDown } from 'lucide-react'
import EmojiPicker from '@/components/EmojiPicker'
import SafeHtml from '@/components/SafeHtml'
import { useLanguage } from '@/components/LanguageProvider'
import { formatLocaleDateTime } from '@/lib/i18n'

interface CommentData {
  id: number
  content: string
  images: string | null
  createdAt: string
  author: { username: string; avatar: string | null }
  replies: CommentData[]
}

interface Post {
  id: number
  title: string
  content: string
  viewCount: number
  createdAt: string
  category: { name: string; slug: string }
  author: { username: string; avatar: string | null }
  comments: CommentData[]
}

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const { language, t } = useLanguage()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [commentImages, setCommentImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<{ username: string; role: string } | null>(null)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [reactions, setReactions] = useState({ favorite: 0, support: 0, oppose: 0, userReactions: [] as string[] })
  const imgInputRef = useRef<HTMLInputElement>(null)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setUser(JSON.parse(userData))
    fetchPost()
    fetchReactions()
  }, [])

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${params.id}`)
      if (res.ok) setPost(await res.json())
    } catch (error) {
      console.error('Failed to fetch post:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReactions = async () => {
    try {
      const headers: Record<string, string> = {}
      const token = localStorage.getItem('token')
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`/api/posts/${params.id}/reactions`, { headers })
      if (res.ok) setReactions(await res.json())
    } catch { /* ignore */ }
  }

  const toggleReaction = async (type: string) => {
    const token = localStorage.getItem('token')
    if (!token) { alert(t('请先登录')); window.location.href = '/login'; return }
    try {
      await fetch(`/api/posts/${params.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type }),
      })
      fetchReactions()
    } catch { /* ignore */ }
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const token = localStorage.getItem('token')
    if (!token) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        })
        if (res.ok) {
          const data = await res.json()
          setCommentImages(prev => [...prev, data.url])
        }
      } catch { /* ignore */ }
    }
    setUploading(false)
    if (imgInputRef.current) imgInputRef.current.value = ''
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    const token = localStorage.getItem('token')
    if (!token) {
      alert(t('请先登录后再评论'))
      window.location.href = '/login'
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: comment,
          postId: parseInt(params.id),
          parentId: replyTo?.id || undefined,
          images: commentImages.length > 0 ? commentImages : undefined,
        }),
      })

      if (res.ok) {
        setComment('')
        setCommentImages([])
        setReplyTo(null)
        setAdvancedMode(false)
        fetchPost()
      } else {
        const data = await res.json()
        alert(data.error || t('评论失败'))
      }
    } catch {
      alert(t('网络错误'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = (commentId: number, username: string) => {
    setReplyTo({ id: commentId, username })
    commentRef.current?.focus()
    commentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const totalComments = post ? post.comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0) : 0
  const fmtDateTime = (d: string) => formatLocaleDateTime(d, language)

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 text-lg">{t('文章不存在')}</p>
        <Link href="/" className="btn-red inline-block mt-4">{t('返回首页')}</Link>
      </div>
    )
  }

  const insertEmoji = (emoji: string) => {
    setComment(prev => prev + emoji)
    commentRef.current?.focus()
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/" className="hover:text-bank-red flex items-center gap-1">
          <ArrowLeft size={12} />{t('首页')}
        </Link>
        <span>&gt;</span>
        <Link href={`/category/${post.category.slug}`} data-no-translate className="hover:text-bank-red">{post.category.name}</Link>
        <span>&gt;</span>
        <span data-no-translate className="text-gray-700 truncate max-w-[300px]">{post.title}</span>
      </div>

      {/* Article */}
      <article className="card">
        <div className="section-header-red">
          <span data-no-translate className="text-sm font-bold">{post.category.name}</span>
        </div>
        <div className="p-6 md:p-8">
          <h1 data-no-translate className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mb-5 pb-5 border-b border-gray-100 dark:border-gray-700">
            <span className="flex items-center gap-1"><User size={12} />{post.author.username}</span>
            <span className="flex items-center gap-1"><Clock size={12} />{fmtDateTime(post.createdAt)}</span>
            <span className="flex items-center gap-1"><Eye size={12} />{language === 'en' ? `${post.viewCount} views` : `${post.viewCount} 次浏览`}</span>
            <span className="flex items-center gap-1"><MessageSquare size={12} />{language === 'en' ? `${totalComments} comments` : `${totalComments} 条评论`}</span>
          </div>
          <div data-no-translate>
            <SafeHtml html={post.content} className="rounded" minHeight={100} />
          </div>

          {/* Reactions */}
          <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => toggleReaction('FAVORITE')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm transition-colors ${
                reactions.userReactions.includes('FAVORITE')
                  ? 'bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-900/30 dark:border-amber-700'
                  : 'border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-amber-600'
              }`}
            >
              <Star size={16} className={reactions.userReactions.includes('FAVORITE') ? 'fill-amber-500' : ''} />
              {t('收藏')} {reactions.favorite}
            </button>
            <button
              onClick={() => toggleReaction('SUPPORT')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm transition-colors ${
                reactions.userReactions.includes('SUPPORT')
                  ? 'bg-green-50 border-green-300 text-green-600 dark:bg-green-900/30 dark:border-green-700'
                  : 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-green-600'
              }`}
            >
              <ThumbsUp size={16} className={reactions.userReactions.includes('SUPPORT') ? 'fill-green-500' : ''} />
              {t('支持')} {reactions.support}
            </button>
            <button
              onClick={() => toggleReaction('OPPOSE')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm transition-colors ${
                reactions.userReactions.includes('OPPOSE')
                  ? 'bg-red-50 border-red-300 text-red-600 dark:bg-red-900/30 dark:border-red-700'
                  : 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-red-600'
              }`}
            >
              <ThumbsDown size={16} className={reactions.userReactions.includes('OPPOSE') ? 'fill-red-500' : ''} />
              {t('反对')} {reactions.oppose}
            </button>
          </div>
        </div>
      </article>

      {/* Comments */}
      <div className="card mt-4">
        <div className="section-header">
          <span className="text-sm font-bold flex items-center gap-2">
            <MessageSquare size={14} />{t('评论区')} ({totalComments})
          </span>
        </div>

        {/* Comment List */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {post.comments.length > 0 ? post.comments.map((c, idx) => (
            <div key={c.id} className="p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-bank-primary to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {c.author.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{c.author.username}</span>
                    <span className="text-[10px] text-gray-400">{fmtDateTime(c.createdAt)}</span>
                    <span className="text-[10px] text-gray-300">{language === 'en' ? `#${idx + 1}` : `#${idx + 1}楼`}</span>
                  </div>
                  <div data-no-translate className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{c.content}</div>
                  {/* Comment images */}
                  {c.images && (() => {
                    try {
                      const imgs = JSON.parse(c.images) as string[]
                      return imgs.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {imgs.map((url, i) => (
                            <img key={i} src={url} alt="" className="max-w-[200px] max-h-[200px] rounded border object-cover" />
                          ))}
                        </div>
                      ) : null
                    } catch { return null }
                  })()}
                  {user && (
                    <button onClick={() => handleReply(c.id, c.author.username)}
                      className="mt-1.5 text-[10px] text-gray-400 hover:text-bank-red flex items-center gap-1 transition-colors">
                      <Reply size={10} />{t('回复')}
                    </button>
                  )}

                  {/* Replies */}
                  {c.replies && c.replies.length > 0 && (
                    <div className="mt-3 space-y-2 border-l-2 border-gray-100 pl-3">
                      {c.replies.map(reply => (
                        <div key={reply.id} className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-xs text-bank-red">{reply.author.username}</span>
                            <span className="text-[10px] text-gray-400">{fmtDateTime(reply.createdAt)}</span>
                          </div>
                          <p data-no-translate className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                          {reply.images && (() => {
                            try {
                              const imgs = JSON.parse(reply.images) as string[]
                              return imgs.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {imgs.map((url, i) => (
                                    <img key={i} src={url} alt="" className="max-w-[120px] max-h-[120px] rounded border object-cover" />
                                  ))}
                                </div>
                              ) : null
                            } catch { return null }
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-400 py-10 text-sm">{t('暂无评论，快来抢沙发吧！')}</p>
          )}
        </div>

        {/* Comment Form — below the list */}
        <div className="p-4 border-t bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
          {user ? (
            <form onSubmit={handleComment}>
              {replyTo && (
                <div className="flex items-center gap-2 mb-2 text-xs text-bank-red bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded">
                  <Reply size={12} />
                  {t('回复')} <strong>{replyTo.username}</strong>
                  <button type="button" onClick={() => setReplyTo(null)} className="ml-auto text-gray-400 hover:text-red-500"><X size={12} /></button>
                </div>
              )}
              <textarea
                ref={commentRef}
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-bank-red focus:border-transparent outline-none resize-none"
                rows={advancedMode ? 8 : 3}
                placeholder={replyTo ? `${t('回复')} ${replyTo.username}...` : t('发表您的评论...')}
                required
              />

              {advancedMode && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => imgInputRef.current?.click()} disabled={uploading}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 border rounded hover:border-bank-red hover:text-bank-red transition-colors">
                      <ImagePlus size={13} />{uploading ? t('上传中...') : t('插入图片')}
                    </button>
                    <span className="text-[10px] text-gray-400">{t('支持 jpg/png/gif，最大10MB')}</span>
                  </div>
                  <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUploadImage} />

                  {commentImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {commentImages.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt="" className="w-20 h-20 object-cover rounded border" />
                          <button type="button" onClick={() => setCommentImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <EmojiPicker onSelect={insertEmoji} />
                  <button type="button" onClick={() => setAdvancedMode(!advancedMode)}
                    className="text-xs text-gray-400 hover:text-bank-red flex items-center gap-1 transition-colors">
                    {advancedMode ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {advancedMode ? t('简洁模式') : t('高级模式 (可添加图片)')}
                  </button>
                </div>
                <button type="submit" disabled={submitting || !comment.trim()}
                  className="btn-red text-xs px-4 py-1.5 flex items-center gap-1 disabled:opacity-50">
                  <Send size={12} />{submitting ? t('提交中...') : t('发表评论')}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('登录后可以参与评论互动')}</p>
              <Link href="/login" className="btn-red inline-block text-sm px-6 py-1.5">{t('立即登录')}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
