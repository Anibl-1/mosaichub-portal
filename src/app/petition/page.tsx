'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Megaphone, ImagePlus, X, Send, Clock, CheckCircle, MessageSquare, Lock, Paperclip, FileText } from 'lucide-react'

interface Petition {
  id: number
  title: string
  content: string
  images: string | null
  attachments: string | null
  type: string
  status: string
  reply: string | null
  repliedAt: string | null
  createdAt: string
  author: { id: number; username: string; realName: string | null }
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
  PROCESSING: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  REPLIED: { label: '已回复', color: 'bg-green-100 text-green-700' },
  CLOSED: { label: '已关闭', color: 'bg-gray-100 text-gray-600' },
}

export default function PetitionPage() {
  return (
    <Suspense fallback={<div className="max-w-[1200px] mx-auto px-4 py-12 text-center text-gray-400 text-sm">加载中...</div>}>
      <PetitionPageContent />
    </Suspense>
  )
}

function PetitionPageContent() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type')
  const isFeedback = typeParam !== 'suggestion'

  const [user, setUser] = useState<{ id: number; username: string; role: string } | null>(null)
  const [tab, setTab] = useState<'submit' | 'list'>('submit')
  const [petitions, setPetitions] = useState<Petition[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [attachments, setAttachments] = useState<{ url: string; name: string; size: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [viewPetition, setViewPetition] = useState<Petition | null>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    if (user && tab === 'list') fetchPetitions()
  }, [user, tab])

  const fetchPetitions = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    setLoading(true)
    try {
      const typeQuery = isFeedback ? 'FEEDBACK' : 'SUGGESTION'
      const res = await fetch(`/api/petitions?type=${typeQuery}&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPetitions(data.petitions || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const token = localStorage.getItem('token')
    if (!token) return
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
        setImages(prev => [...prev, data.url])
      }
    } catch {}
    if (imgInputRef.current) imgInputRef.current.value = ''
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const token = localStorage.getItem('token')
    if (!token) return
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
        setAttachments(prev => [...prev, { url: data.url, name: file.name, size: file.size }])
      }
    } catch {}
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!title.trim() || !content.trim()) {
      setError('请填写标题和内容')
      return
    }
    const token = localStorage.getItem('token')
    if (!token || !user) {
      setError('请先登录')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/petitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          images: images.length > 0 ? JSON.stringify(images) : null,
          attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
          type: isFeedback ? 'FEEDBACK' : 'SUGGESTION',
        }),
      })
      if (res.ok) {
        setSuccess('提交成功！您的内容将被保密处理，仅您本人和管理员可查看。')
        setTitle('')
        setContent('')
        setImages([])
        setAttachments([])
      } else {
        const data = await res.json()
        setError(data.error || '提交失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setSubmitting(false)
    }
  }

  const viewDetail = async (id: number) => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch(`/api/petitions/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) setViewPetition(await res.json())
    } catch {}
  }

  const fmtDate = (d: string) => new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

  const themeColor = isFeedback ? 'bank-red' : 'amber-600'
  const headerBg = isFeedback ? 'from-bank-red to-red-800' : 'from-amber-500 to-orange-600'

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href="/" className="text-xs text-gray-500 dark:text-gray-400 hover:text-bank-red flex items-center gap-1">
          <ArrowLeft size={12} />返回首页
        </Link>
      </div>

      {/* Header */}
      <div className={`card overflow-hidden mb-4`}>
        <div className={`bg-gradient-to-r ${headerBg} p-5 flex items-center gap-4`}>
          <div className="w-14 h-14 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
            {isFeedback ? <AlertTriangle size={28} className="text-white" /> : <Megaphone size={28} className="text-white" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{isFeedback ? '互动反馈' : '意见建议征集'}</h1>
            <p className="text-white/70 text-xs mt-1">
              {isFeedback
                ? '您的反馈内容将严格保密，仅本人和管理员可查看'
                : '欢迎提出宝贵的意见和建议，我们将认真处理'}
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 mb-4 flex items-start gap-2">
        <Lock size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          <strong>隐私保护提示：</strong>您提交的内容仅自己和管理员可见，不会公开展示。请放心填写真实情况。
        </div>
      </div>

      {/* Tabs */}
      {user ? (
        <>
          <div className="flex gap-1 mb-4">
            <button onClick={() => { setTab('submit'); setViewPetition(null) }}
              className={`px-4 py-2 text-sm rounded-t-lg font-medium transition-colors ${tab === 'submit' ? 'bg-white text-bank-red border border-b-0 border-gray-200' : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
              我要提交
            </button>
            <button onClick={() => { setTab('list'); setViewPetition(null) }}
              className={`px-4 py-2 text-sm rounded-t-lg font-medium transition-colors ${tab === 'list' ? 'bg-white text-bank-red border border-b-0 border-gray-200' : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
              我的提交记录
            </button>
          </div>

          {tab === 'submit' && (
            <div className="card p-6">
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                  <CheckCircle size={16} />{success}
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题 <span className="text-red-500">*</span></label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-bank-red focus:border-transparent outline-none bg-gray-50 focus:bg-white"
                    placeholder={isFeedback ? '请简要描述您的反馈内容' : '请简要描述您的建议'} required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">详细内容 <span className="text-red-500">*</span></label>
                  <textarea value={content} onChange={e => setContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-bank-red focus:border-transparent outline-none bg-gray-50 focus:bg-white resize-none"
                    rows={8}
                    placeholder={isFeedback ? '请详细描述您的反馈内容...' : '请详细描述您的意见或建议...'}
                    required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">附图（选填）</label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {images.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt="" className="w-20 h-20 object-cover rounded border" />
                        <button type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <button type="button" onClick={() => imgInputRef.current?.click()}
                        className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:border-bank-red hover:text-bank-red transition-colors cursor-pointer">
                        <ImagePlus size={18} />
                        <span className="text-[9px] mt-0.5">添加图片</span>
                      </button>
                    )}
                  </div>
                  <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">附件（选填）</label>
                  <div className="space-y-2">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
                        <FileText size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-700 flex-1 truncate">{att.name}</span>
                        <span className="text-[10px] text-gray-400">{(att.size / 1024).toFixed(0)}KB</span>
                        <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-600"><X size={12} /></button>
                      </div>
                    ))}
                    {attachments.length < 5 && (
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-bank-red border border-dashed border-gray-300 hover:border-bank-red rounded-lg px-3 py-2 transition-colors">
                        <Paperclip size={12} />上传附件（支持文档、PDF等，最多5个）
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" className="hidden" onChange={handleFileUpload} />
                </div>

                <button type="submit" disabled={submitting}
                  className={`bg-gradient-to-r ${headerBg} text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50`}>
                  <Send size={14} />
                  {submitting ? '提交中...' : '提交'}
                </button>
              </form>
            </div>
          )}

          {tab === 'list' && !viewPetition && (
            <div className="card">
              {loading ? (
                <div className="p-8 text-center text-gray-400 text-sm">加载中...</div>
              ) : petitions.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">暂无提交记录</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {petitions.map(p => (
                    <div key={p.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => viewDetail(p.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-800 line-clamp-1">{p.title}</h3>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-1">{p.content}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusMap[p.status]?.color || 'bg-gray-100 text-gray-500'}`}>
                            {statusMap[p.status]?.label || p.status}
                          </span>
                          <span className="text-[10px] text-gray-400">{fmtDate(p.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'list' && viewPetition && (
            <div className="card p-5">
              <button onClick={() => setViewPetition(null)} className="text-xs text-gray-500 hover:text-bank-red mb-4 flex items-center gap-1">
                <ArrowLeft size={12} /> 返回列表
              </button>

              <div className="flex items-start justify-between mb-4">
                <h2 className="text-base font-bold text-gray-800">{viewPetition.title}</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${statusMap[viewPetition.status]?.color}`}>
                  {statusMap[viewPetition.status]?.label}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-4">
                <span className="flex items-center gap-1"><Clock size={10} />{fmtDate(viewPetition.createdAt)}</span>
                <span>提交人: {viewPetition.author.realName || viewPetition.author.username}</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{viewPetition.content}</p>
              </div>

              {viewPetition.images && (() => {
                try {
                  const imgs = JSON.parse(viewPetition.images)
                  if (Array.isArray(imgs) && imgs.length > 0) {
                    return (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {imgs.map((url: string, i: number) => (
                          <img key={i} src={url} alt="" className="w-28 h-28 object-cover rounded border" />
                        ))}
                      </div>
                    )
                  }
                } catch { return null }
              })()}

              {viewPetition.attachments && (() => {
                try {
                  const atts = JSON.parse(viewPetition.attachments)
                  if (Array.isArray(atts) && atts.length > 0) {
                    return (
                      <div className="space-y-1.5 mb-4">
                        <p className="text-xs font-medium text-gray-600">附件：</p>
                        {atts.map((att: { url: string; name: string; size: number }, i: number) => (
                          <a key={i} href={att.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border hover:bg-blue-50 hover:border-blue-200 transition-colors">
                            <FileText size={14} className="text-blue-500 flex-shrink-0" />
                            <span className="text-xs text-blue-600 flex-1 truncate">{att.name}</span>
                            <span className="text-[10px] text-gray-400">{(att.size / 1024).toFixed(0)}KB</span>
                          </a>
                        ))}
                      </div>
                    )
                  }
                } catch { return null }
              })()}

              {viewPetition.reply && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MessageSquare size={14} className="text-green-600" />
                    <span className="text-sm font-medium text-green-700">管理员回复</span>
                    {viewPetition.repliedAt && (
                      <span className="text-[10px] text-gray-400 ml-2">{fmtDate(viewPetition.repliedAt)}</span>
                    )}
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{viewPetition.reply}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="card p-8 text-center">
          <Lock size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">请先登录后提交{isFeedback ? '互动反馈' : '意见建议'}</p>
          <Link href="/login" className="bg-bank-red text-white px-6 py-2 rounded-lg text-sm hover:bg-bank-redDark transition-colors inline-block">
            立即登录
          </Link>
        </div>
      )}
    </div>
  )
}
