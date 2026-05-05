'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ImagePlus, Paperclip, X, ArrowLeft, Sparkles, Wand2, FileText, AlignLeft } from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
}

export default function CreatePostPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<{ id: number; username: string; role: string; permissions: string[] } | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [images, setImages] = useState<{ url: string; name: string }[]>([])
  const [attachments, setAttachments] = useState<{ url: string; name: string; size: number }[]>([])
  const [coverImage, setCoverImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)

  const aiRequest = async (messages: { role: string; content: string }[], systemPrompt: string): Promise<string | null> => {
    const token = localStorage.getItem('token')
    if (!token) { setError('请先登录'); return null }
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ messages, systemPrompt }),
      })
      const data = await res.json()
      if (res.ok && data.content) return data.content
      setError(data.error || 'AI 请求失败，请检查管理后台 AI 配置')
      return null
    } catch {
      setError('AI 网络错误，请检查网络连接')
      return null
    }
  }

  const aiGenerateArticle = async () => {
    if (!title.trim()) { setError('请先输入标题'); return }
    setAiLoading('article')
    const catName = categories.find(c => String(c.id) === categoryId)?.name || ''
    const result = await aiRequest(
      [{ role: 'user', content: `请根据标题「${title}」写一篇${catName ? `属于"${catName}"分类的` : ''}文章。要求：1.正文800-1500字 2.语言正式专业 3.结构清晰有条理 4.直接返回正文文字，不需要标题` }],
      '你是门户网站内容编辑。直接输出文章正文，不要任何前缀说明。'
    )
    if (result) setContent(result)
    else setError('AI 生成失败，请检查 AI 配置')
    setAiLoading(null)
  }

  const aiGenerateSummary = async () => {
    if (!content.trim()) { setError('请先输入内容'); return }
    setAiLoading('summary')
    const result = await aiRequest(
      [{ role: 'user', content: `请为以下文章生成一句话摘要（30-80字）：\n\n${content.slice(0, 2000)}` }],
      '你是摘要生成器。只返回摘要文字，不要任何前缀。'
    )
    if (result) setSummary(result.replace(/^["「]|["」]$/g, ''))
    else setError('AI 生成失败')
    setAiLoading(null)
  }

  const aiPolishContent = async () => {
    if (!content.trim()) { setError('请先输入内容'); return }
    setAiLoading('polish')
    const result = await aiRequest(
      [{ role: 'user', content: `请润色优化以下文章，使其更通顺、专业，保持原意不变：\n\n${content}` }],
      '你是文字润色专家。直接返回润色后的全文，不要任何说明。'
    )
    if (result) setContent(result)
    else setError('AI 润色失败')
    setAiLoading(null)
  }

  const aiGenerateTitle = async () => {
    if (!content.trim()) { setError('请先输入内容'); return }
    setAiLoading('title')
    const result = await aiRequest(
      [{ role: 'user', content: `请根据以下文章内容生成一个精炼的标题（10-25字）：\n\n${content.slice(0, 1500)}` }],
      '你是标题生成器。只返回标题文字，不要引号和任何前缀。'
    )
    if (result) setTitle(result.replace(/^["「『]|["」』]$/g, '').trim())
    else setError('AI 生成失败')
    setAiLoading(null)
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token || !userData) {
      router.push('/login')
      return
    }
    const parsed = JSON.parse(userData)
    if (parsed.role !== 'ADMIN' && parsed.role !== 'SUPER_ADMIN') {
      alert('仅管理员可以发布文章')
      router.push('/')
      return
    }
    const perms: string[] = parsed.permissions || []
    const hasPublish = parsed.role === 'SUPER_ADMIN' || perms.includes('publish') || perms.some((p: string) => p.startsWith('publish:'))
    if (!hasPublish) {
      alert('您没有发布文章的权限')
      router.push('/')
      return
    }
    setUser({ ...parsed, permissions: perms })
    fetchCategories()
  }, [router])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) setCategories(await res.json())
    } catch (e) {
      console.error('Failed to fetch categories:', e)
    }
  }

  const uploadFile = async (file: File): Promise<{ url: string; name: string; size: number } | null> => {
    const token = localStorage.getItem('token')
    if (!token) return null

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
        return { url: data.url, name: data.originalName, size: data.size }
      } else {
        const data = await res.json()
        setError(data.error || '上传失败')
        return null
      }
    } catch {
      setError('上传失败')
      return null
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const result = await uploadFile(file)
      if (result) {
        setImages(prev => [...prev, { url: result.url, name: result.name }])
      }
    }
    setUploading(false)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const result = await uploadFile(file)
      if (result) {
        setAttachments(prev => [...prev, result])
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx))
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const result = await uploadFile(file)
    if (result) setCoverImage(result.url)
    setUploading(false)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!title.trim() || !content.trim() || !categoryId) {
      setError('请填写标题、内容并选择分类')
      return
    }

    const token = localStorage.getItem('token')
    if (!token || !user) return

    setLoading(true)

    // Build HTML content with images
    let htmlContent = content.replace(/\n/g, '<br/>')
    if (images.length > 0) {
      htmlContent += '<div class="post-images">'
      images.forEach(img => {
        htmlContent += `<img src="${img.url}" alt="${img.name}" style="max-width:100%;margin:8px 0;border-radius:4px;" />`
      })
      htmlContent += '</div>'
    }
    if (attachments.length > 0) {
      htmlContent += '<div class="post-attachments"><p><strong>附件：</strong></p><ul>'
      attachments.forEach(att => {
        htmlContent += `<li><a href="${att.url}" target="_blank">${att.name}</a> (${(att.size / 1024).toFixed(1)}KB)</li>`
      })
      htmlContent += '</ul></div>'
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content: htmlContent,
          summary: summary || title.slice(0, 100),
          categoryId: parseInt(categoryId),
          coverImage: coverImage || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/post/${data.id}`)
      } else {
        const data = await res.json()
        setError(data.error || '发布失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-bank-red flex items-center gap-1">
          <ArrowLeft size={14} />返回首页
        </Link>
      </div>

      <div className="card relative">
        {aiLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-20 flex items-center justify-center rounded-xl backdrop-blur-sm">
            <div className="text-center">
              <Sparkles size={28} className="text-purple-400 mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-purple-600 font-medium">
                {aiLoading === 'article' ? 'AI 正在写文章...' : aiLoading === 'polish' ? 'AI 正在润色...' : aiLoading === 'summary' ? 'AI 生成摘要中...' : 'AI 生成标题中...'}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">请稍候，通常需要 10-30 秒</p>
            </div>
          </div>
        )}
        <div className="section-header-red">
          <span className="section-title text-sm">发布文章</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
          )}

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">封面图片 <span className="text-gray-400 text-xs font-normal">(显示在首页，强烈建议上传)</span></label>
            <div className="flex items-center gap-4">
              {coverImage ? (
                <div className="relative group">
                  <img src={coverImage} alt="封面" className="w-40 h-24 object-cover rounded border" />
                  <button type="button" onClick={() => setCoverImage('')}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploading}
                  className="w-40 h-24 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:border-bank-red hover:text-bank-red transition-colors cursor-pointer">
                  <ImagePlus size={20} />
                  <span className="text-[10px] mt-1">{uploading ? '上传中...' : '点击上传封面'}</span>
                </button>
              )}
              <div className="text-xs text-gray-400 leading-relaxed">
                <p>建议尺寸: 800×500 像素</p>
                <p>支持 jpg/png/gif 格式</p>
                <p>上传封面后将展示在首页轮播和热点图片中</p>
              </div>
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类 <span className="text-red-500">*</span></label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-bank-red focus:border-transparent outline-none"
                required
              >
                <option value="">请选择分类</option>
                {categories.filter(cat => user?.role === 'SUPER_ADMIN' || user?.permissions?.includes('publish') || user?.permissions?.includes(`publish:${cat.slug}`)).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">摘要</label>
                <button type="button" onClick={aiGenerateSummary} disabled={!!aiLoading}
                  className="text-[10px] text-purple-500 hover:text-purple-700 flex items-center gap-1 disabled:opacity-40">
                  <AlignLeft size={10} />{aiLoading === 'summary' ? '生成中...' : 'AI摘要'}
                </button>
              </div>
              <input
                type="text"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-bank-red focus:border-transparent outline-none"
                placeholder="简短描述（选填）"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">标题 <span className="text-red-500">*</span></label>
              <button type="button" onClick={aiGenerateTitle} disabled={!!aiLoading}
                className="text-[10px] text-purple-500 hover:text-purple-700 flex items-center gap-1 disabled:opacity-40">
                <Sparkles size={10} />{aiLoading === 'title' ? '生成中...' : 'AI生成标题'}
              </button>
            </div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-bank-red focus:border-transparent outline-none"
              placeholder="请输入帖子标题"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">内容 <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={aiGenerateArticle} disabled={!!aiLoading}
                  className="text-[10px] px-2 py-1 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center gap-1 disabled:opacity-40 transition-colors">
                  <FileText size={10} />{aiLoading === 'article' ? '生成中...' : 'AI写文章'}
                </button>
                <button type="button" onClick={aiPolishContent} disabled={!!aiLoading}
                  className="text-[10px] px-2 py-1 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center gap-1 disabled:opacity-40 transition-colors">
                  <Wand2 size={10} />{aiLoading === 'polish' ? '润色中...' : 'AI润色'}
                </button>
              </div>
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-bank-red focus:border-transparent outline-none resize-none"
              rows={12}
              placeholder="请输入帖子内容..."
              required
            />
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-bank-red transition-colors px-3 py-1.5 border border-gray-200 rounded hover:border-bank-red"
                disabled={uploading}
              >
                <ImagePlus size={14} />
                {uploading ? '上传中...' : '插入图片'}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-bank-red transition-colors px-3 py-1.5 border border-gray-200 rounded hover:border-bank-red"
                disabled={uploading}
              >
                <Paperclip size={14} />
                {uploading ? '上传中...' : '添加附件'}
              </button>
              <span className="text-[10px] text-gray-400">支持 jpg/png/gif/pdf/doc，最大10MB</span>
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" multiple className="hidden" onChange={handleAttachmentUpload} />
          </div>

          {/* Preview images */}
          {images.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">已上传图片：</p>
              <div className="flex flex-wrap gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img.url} alt={img.name} className="w-24 h-24 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments list */}
          {attachments.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">已上传附件：</p>
              <div className="space-y-1">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded">
                    <Paperclip size={12} />
                    <span className="flex-1">{att.name} ({(att.size / 1024).toFixed(1)}KB)</span>
                    <button type="button" onClick={() => removeAttachment(idx)} className="text-red-400 hover:text-red-600">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-red"
            >
              {loading ? '发布中...' : '发布文章'}
            </button>
            <Link href="/" className="px-6 py-2 border rounded text-sm hover:bg-gray-50">取消</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
