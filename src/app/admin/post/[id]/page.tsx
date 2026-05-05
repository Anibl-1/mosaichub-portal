'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ImagePlus, Save, X } from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
}

export default function AdminPostEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const imgRef = useRef<HTMLInputElement>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    title: '',
    content: '',
    summary: '',
    categoryId: '',
    isTop: false,
    coverImage: '',
    status: 'PUBLISHED',
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData || JSON.parse(userData).role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchData()
  }, [router, params.id])

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const [catRes, postRes] = await Promise.all([
        fetch('/api/categories'),
        fetch(`/api/posts/${params.id}`),
      ])
      if (catRes.ok) setCategories(await catRes.json())
      if (postRes.ok) {
        const post = await postRes.json()
        setForm({
          title: post.title,
          content: post.content,
          summary: post.summary || '',
          categoryId: String(post.category?.id || ''),
          isTop: post.isTop,
          coverImage: post.coverImage || '',
          status: post.status || 'PUBLISHED',
        })
      }
    } catch (e) {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const token = localStorage.getItem('token')
    if (!token) return
    setUploading(true)
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
        setForm(prev => ({ ...prev, coverImage: data.url }))
      }
    } catch { /* ignore */ }
    setUploading(false)
    if (imgRef.current) imgRef.current.value = ''
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const token = localStorage.getItem('token')
    if (!token) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/posts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          summary: form.summary || null,
          categoryId: parseInt(form.categoryId),
          isTop: form.isTop,
          coverImage: form.coverImage || null,
          status: form.status,
        }),
      })
      if (res.ok) {
        setSuccess('保存成功')
      } else {
        const data = await res.json()
        setError(data.error || '保存失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">加载中...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href="/admin" className="text-xs text-gray-500 hover:text-bank-red flex items-center gap-1">
          <ArrowLeft size={12} />返回管理中心
        </Link>
      </div>

      <div className="card">
        <div className="section-header">
          <span className="section-title text-sm">编辑文章 #{params.id}</span>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">{success}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">分类</label>
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-bank-red outline-none" required>
                <option value="">选择分类</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">状态</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-bank-red outline-none">
                <option value="PUBLISHED">已发布</option>
                <option value="DRAFT">草稿</option>
                <option value="ARCHIVED">归档</option>
              </select>
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isTop} onChange={e => setForm({ ...form, isTop: e.target.checked })} className="rounded" />
                置顶
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">标题</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-bank-red outline-none" required />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">摘要</label>
            <input type="text" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })}
              className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-bank-red outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">封面图</label>
            <div className="flex items-center gap-3">
              {form.coverImage && (
                <div className="relative group">
                  <img src={form.coverImage} alt="" className="w-32 h-20 object-cover rounded border" />
                  <button type="button" onClick={() => setForm({ ...form, coverImage: '' })}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">
                    <X size={10} />
                  </button>
                </div>
              )}
              <button type="button" onClick={() => imgRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1 text-xs px-3 py-1.5 border rounded hover:border-bank-red hover:text-bank-red transition-colors">
                <ImagePlus size={13} />{uploading ? '上传中...' : '上传封面'}
              </button>
              <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">内容 (HTML)</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-bank-red outline-none resize-none font-mono" rows={16} required />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-red flex items-center gap-1">
              <Save size={14} />{saving ? '保存中...' : '保存修改'}
            </button>
            <Link href="/admin" className="px-4 py-2 border rounded text-sm hover:bg-gray-50">返回列表</Link>
            <Link href={`/post/${params.id}`} target="_blank" className="px-4 py-2 border rounded text-sm hover:bg-gray-50">预览</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
