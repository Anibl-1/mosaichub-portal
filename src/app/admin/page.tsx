'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Users, BarChart3, MessageSquare, Trash2, Eye, Edit, ImagePlus, Navigation, GripVertical, ExternalLink, Lock, Upload, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, X, Layout, Newspaper, Image, Link2, List, Grid3X3, Megaphone, Code2, Sparkles, Bot, Zap, Send, Wand2, Copy, RotateCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTheme, THEME_PRESETS } from '@/components/ThemeProvider'

interface AdminPost {
  id: number
  title: string
  content: string
  summary: string | null
  status: string
  isTop: boolean
  topSort: number
  viewCount: number
  categoryId: number
  coverImage: string | null
  createdAt: string
  category: { name: string; slug: string }
  author: { username: string }
  _count: { comments: number }
}

interface AdminUser {
  id: number
  username: string
  email: string | null
  realName: string | null
  role: string
  permissions: string[]
  createdAt: string
  _count: { posts: number; comments: number }
}

interface AdminComment {
  id: number
  content: string
  createdAt: string
  author: { username: string }
  post: { id: number; title: string; category?: { name: string; slug: string } }
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

const MODULE_TYPES: { value: HomeModule['type']; label: string; desc: string; group: 'article' | 'display' | 'custom'; icon: string }[] = [
  { value: 'category_list', label: '分类文章', desc: '按分类展示文章列表，支持Tab切换', group: 'article', icon: '📰' },
  { value: 'news_feed', label: '综合快讯', desc: '最新文章流，简洁列表形式', group: 'article', icon: '📨' },
  { value: 'latest_covers', label: '图文列表', desc: '带封面图片的文章卡片', group: 'article', icon: '🖼️' },
  { value: 'banner', label: '轮播横幅', desc: '顶部大图轮播，展示置顶文章', group: 'display', icon: '🎠' },
  { value: 'top_headline', label: '今日头条', desc: '突出显示头条新闻', group: 'display', icon: '📌' },
  { value: 'image_grid', label: '热点图片', desc: '网格图片展示区域', group: 'display', icon: '🖼️' },
  { value: 'quick_links', label: '快捷导航', desc: '分类快捷入口，横向图标', group: 'display', icon: '🔗' },
  { value: 'custom', label: '自定义HTML', desc: '自由编写HTML内容', group: 'custom', icon: '💻' },
]

const LAYOUT_TEMPLATES: { value: string; label: string; desc: string }[] = [
  { value: 'default', label: '默认列表', desc: '经典文字列表布局' },
  { value: 'card', label: '卡片网格', desc: '带封面的卡片排列' },
  { value: 'image_left', label: '左图右文', desc: '左侧图片+右侧摘要' },
  { value: 'headline', label: '头条大图', desc: '首条大图+列表' },
]

const WIDTH_OPTIONS: { value: HomeModule['width']; label: string }[] = [
  { value: 'full', label: '整行' },
  { value: 'two-thirds', label: '2/3 宽' },
  { value: 'half', label: '1/2 宽' },
  { value: 'third', label: '1/3 宽' },
]

const defaultHomeModules: HomeModule[] = [
  { id: 'banner', type: 'banner', title: '轮播横幅', width: 'two-thirds', sort: 1, visible: true },
  { id: 'headline', type: 'top_headline', title: '今日头条', width: 'third', sort: 2, visible: true },
  { id: 'hot_images', type: 'image_grid', title: '热点图片', width: 'third', sort: 3, visible: true },
  { id: 'quick_links', type: 'quick_links', title: '快捷导航', width: 'full', sort: 4, visible: true },
  { id: 'cat1', type: 'category_list', title: '', category: 'feedback', width: 'half', sort: 5, visible: true, config: { limit: 8, tabWith: 'suggestions' } },
  { id: 'cat2', type: 'category_list', title: '', category: 'notice', width: 'half', sort: 6, visible: true, config: { limit: 8, tabWith: 'news' } },
  { id: 'news_feed', type: 'news_feed', title: '综合快讯', width: 'full', sort: 7, visible: true, config: { limit: 8 } },
  { id: 'latest', type: 'latest_covers', title: '最新发布', width: 'full', sort: 8, visible: true, config: { limit: 5 } },
]

interface NavMenuData {
  id: number
  name: string
  url: string | null
  icon: string | null
  sort: number
  parentId: number | null
  visible: boolean
  children: NavMenuData[]
}

export default function AdminPage() {
  const router = useRouter()
  const { themeColor } = useTheme()
  const currentThemeHex = THEME_PRESETS.find(p => p.key === themeColor)?.red || '#c4161c'
  const [user, setUser] = useState<{ username: string; role: string; id: number; permissions: string[] } | null>(null)
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([])
  const [showPostForm, setShowPostForm] = useState(false)
  const [postForm, setPostForm] = useState({ title: '', content: '', summary: '', categoryId: '', isTop: false })
  const [message, setMessage] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')
  const [stats, setStats] = useState({ postCount: 0, userCount: 0, commentCount: 0, totalViews: 0 })
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [allPostTitles, setAllPostTitles] = useState<{id: number; title: string}[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [comments, setComments] = useState<AdminComment[]>([])
  const [homeModules, setHomeModules] = useState<HomeModule[]>(defaultHomeModules)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [showModuleTypePicker, setShowModuleTypePicker] = useState(false)
  const [modulesCollapsed, setModulesCollapsed] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'comments' | 'users' | 'menus' | 'settings'>('overview')
  const [popupImage, setPopupImage] = useState('')
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({
    site_name: '', site_short_name: '', site_logo_text: '', site_logo_subtitle: '',
    site_hotline: '', site_copyright: '', site_icp: '', sensitive_words: '',
  })
  const [uploading, setUploading] = useState(false)
  const [coverImage, setCoverImage] = useState('')
  const [navMenus, setNavMenus] = useState<NavMenuData[]>([])
  const [menuForm, setMenuForm] = useState({ name: '', url: '', sort: 0, parentId: '', visible: true })
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [editingMenuId, setEditingMenuId] = useState<number | null>(null)
  const [postPage, setPostPage] = useState(1)
  const [postTotal, setPostTotal] = useState(0)
  const [postTotalPages, setPostTotalPages] = useState(1)
  const [postSearch, setPostSearch] = useState('')
  const [commentPage, setCommentPage] = useState(1)
  const [commentTotal, setCommentTotal] = useState(0)
  const [commentTotalPages, setCommentTotalPages] = useState(1)
  const [commentSearch, setCommentSearch] = useState('')
  const [postCategoryFilter, setPostCategoryFilter] = useState('')
  const [commentPostFilter, setCommentPostFilter] = useState('')
  const [permEditUser, setPermEditUser] = useState<AdminUser | null>(null)
  const [permEditPerms, setPermEditPerms] = useState<string[]>([])
  const [commentCategoryFilter, setCommentCategoryFilter] = useState('')
  const [myPosts, setMyPosts] = useState<AdminPost[]>([])
  const [myPostPage, setMyPostPage] = useState(1)
  const [myPostTotal, setMyPostTotal] = useState(0)
  const [myPostTotalPages, setMyPostTotalPages] = useState(1)
  const [myPostSearch, setMyPostSearch] = useState('')
  const [myPostCategory, setMyPostCategory] = useState('')
  const myPostSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null)
  const [editForm, setEditForm] = useState({ title: '', content: '', summary: '', categoryId: '', coverImage: '' })
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void; danger?: boolean } | null>(null)
  // AI states
  const [aiConfig, setAiConfig] = useState<{
    provider: string; apiKey: string; apiBase: string; model: string; temperature: number; maxTokens: number
  }>({ provider: 'openai', apiKey: '', apiBase: '', model: 'gpt-3.5-turbo', temperature: 0.7, maxTokens: 2048 })
  const [aiConfigLoaded, setAiConfigLoaded] = useState(false)
  const [aiConfigCollapsed, setAiConfigCollapsed] = useState(true)
  const [aiTesting, setAiTesting] = useState(false)
  const [aiTestResult, setAiTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [aiChatGenerating, setAiChatGenerating] = useState(false)
  const [aiHtmlGenerating, setAiHtmlGenerating] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiChatMessages, setAiChatMessages] = useState<{ role: string; content: string }[]>([])
  const [aiChatInput, setAiChatInput] = useState('')
  const [aiChatSessionId] = useState(() => `chat_${Date.now()}`)
  const [aiChatLoaded, setAiChatLoaded] = useState(false)
  const aiChatEndRef = useRef<HTMLDivElement>(null)
  // AI Layout Designer
  const [showAiDesigner, setShowAiDesigner] = useState(false)
  const [designerMessages, setDesignerMessages] = useState<{ role: string; content: string }[]>([])
  const [designerInput, setDesignerInput] = useState('')
  const [designerSessionId] = useState(() => `designer_${Date.now()}`)
  const [designerGenerating, setDesignerGenerating] = useState(false)
  const [designerModules, setDesignerModules] = useState<HomeModule[]>([])
  const [designerDragIdx, setDesignerDragIdx] = useState<number | null>(null)
  const designerChatEndRef = useRef<HTMLDivElement>(null)
  const POST_PAGE_SIZE = 15

  const fetchAllPostTitles = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch('/api/admin/posts?page=1&limit=200', { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) { const data = await res.json(); setAllPostTitles((data.posts || []).map((p: AdminPost) => ({ id: p.id, title: p.title }))) }
    } catch { /* ignore */ }
  }, [])
  const COMMENT_PAGE_SIZE = 20
  const postSearchTimer = useRef<NodeJS.Timeout | null>(null)
  const commentSearchTimer = useRef<NodeJS.Timeout | null>(null)

  const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg)
    setMsgType(type)
    setTimeout(() => setMessage(''), 3000)
  }

  const getToken = () => localStorage.getItem('token')

  const fetchPosts = useCallback(async (page = 1, search?: string, category?: string) => {
    const token = getToken()
    if (!token) return
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(POST_PAGE_SIZE) })
      const s = search !== undefined ? search : postSearch
      const c = category !== undefined ? category : postCategoryFilter
      if (s) params.set('search', s)
      if (c) params.set('category', c)
      const res = await fetch(`/api/admin/posts?${params}`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
        setPostTotal(data.total || 0)
        setPostTotalPages(data.totalPages || 1)
        setPostPage(page)
      }
    } catch { /* ignore */ }
  }, [postSearch, postCategoryFilter])

  const fetchUsers = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) setUsers(await res.json())
    } catch { /* ignore */ }
  }, [])

  const fetchComments = useCallback(async (page = 1, search?: string, postId?: string, category?: string) => {
    const token = getToken()
    if (!token) return
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(COMMENT_PAGE_SIZE) })
      const s = search !== undefined ? search : commentSearch
      const pid = postId !== undefined ? postId : commentPostFilter
      const cat = category !== undefined ? category : commentCategoryFilter
      if (s) params.set('search', s)
      if (pid) params.set('postId', pid)
      if (cat) params.set('category', cat)
      const res = await fetch(`/api/admin/comments?${params}`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
        setCommentTotal(data.total || 0)
        setCommentTotalPages(data.totalPages || 1)
        setCommentPage(page)
      }
    } catch { /* ignore */ }
  }, [commentSearch, commentPostFilter, commentCategoryFilter])


  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token || !userData) { window.location.href = '/login'; return }
    const parsed = JSON.parse(userData)
    if (parsed.role !== 'ADMIN' && parsed.role !== 'SUPER_ADMIN') { window.location.href = '/'; return }
    setUser(parsed)
    // Refresh permissions from DB
    fetch('/api/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          const fresh = { ...parsed, role: data.role, permissions: data.permissions || [] }
          setUser(fresh)
          localStorage.setItem('user', JSON.stringify(fresh))
        }
      }).catch(() => {})
    fetchCategories()
    fetchStats()
    fetchPosts()
  }, [fetchPosts])

  const fetchNavMenus = useCallback(async () => {
    try {
      const res = await fetch('/api/nav-menus')
      if (res.ok) setNavMenus(await res.json())
    } catch { /* ignore */ }
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data: Array<{ key: string; value: string }> = await res.json()
        const map: Record<string, string> = {}
        data.forEach(s => { map[s.key] = s.value || '' })
        if (map.popup_image !== undefined) setPopupImage(map.popup_image)
        if (map.home_modules) {
          try { const parsed = JSON.parse(map.home_modules); if (Array.isArray(parsed) && parsed.length > 0) setHomeModules(parsed) } catch { /* ignore */ }
        }
        setSiteSettings(prev => ({ ...prev, ...map }))
      }
      setSettingsLoaded(true)
    } catch { /* ignore */ }
  }

  const saveSiteSetting = async (key: string, value: string, label: string) => {
    const token = getToken()
    if (!token) return
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ key, value, label }),
      })
      showMsg(`${label} 已保存`)
    } catch { showMsg('保存失败', 'error') }
  }

  const savePopupImage = async (url: string) => {
    const token = getToken()
    if (!token) return
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ key: 'popup_image', value: url, label: '悬浮按钮弹窗图片' }),
      })
    } catch { /* ignore */ }
  }

  const MY_POST_PAGE_SIZE = 10
  const fetchMyPosts = async (page = 1, search?: string, category?: string) => {
    const token = getToken()
    const userData = localStorage.getItem('user')
    if (!token || !userData) return
    const uid = JSON.parse(userData).id
    const params = new URLSearchParams({ page: String(page), limit: String(MY_POST_PAGE_SIZE), authorId: String(uid) })
    const s = search !== undefined ? search : myPostSearch
    const c = category !== undefined ? category : myPostCategory
    if (s) params.set('search', s)
    if (c) params.set('category', c)
    try {
      const res = await fetch(`/api/admin/posts?${params}`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setMyPosts(data.posts || [])
        setMyPostTotal(data.total || 0)
        setMyPostTotalPages(data.totalPages || 1)
        setMyPostPage(page)
      }
    } catch { /* ignore */ }
  }

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPost) return
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`/api/admin/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: editForm.title,
          content: editForm.content,
          summary: editForm.summary,
          categoryId: parseInt(editForm.categoryId),
          coverImage: editForm.coverImage || null,
        }),
      })
      if (res.ok) { showMsg('修改成功'); setEditingPost(null); fetchMyPosts(myPostPage) }
      else { const data = await res.json(); showMsg(data.error || '修改失败', 'error') }
    } catch { showMsg('网络错误', 'error') }
  }

  useEffect(() => {
    if (activeTab === 'overview') fetchMyPosts()
    if (activeTab === 'posts') fetchPosts(1)
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'comments') { fetchComments(1); fetchAllPostTitles() }
    if (activeTab === 'menus') fetchNavMenus()
    if (activeTab === 'settings' && !settingsLoaded) fetchSettings()
    if (activeTab === 'settings') loadAiConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, fetchUsers, fetchComments, fetchNavMenus, fetchPosts, fetchAllPostTitles, settingsLoaded])

  const fetchCategories = async () => {
    try { const res = await fetch('/api/categories'); if (res.ok) setCategories(await res.json()) } catch { /* ignore */ }
  }
  const fetchStats = async () => {
    const token = getToken()
    if (!token) return
    try { const res = await fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setStats(await res.json()) } catch { /* ignore */ }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = getToken()
    if (!token || !user) return
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...postForm, categoryId: parseInt(postForm.categoryId), coverImage: coverImage || undefined }),
      })
      if (res.ok) {
        showMsg('发布成功！')
        setPostForm({ title: '', content: '', summary: '', categoryId: '', isTop: false })
        setCoverImage('')
        setShowPostForm(false)
        fetchStats(); fetchPosts()
      } else { const data = await res.json(); showMsg(data.error || '发布失败', 'error') }
    } catch { showMsg('网络错误', 'error') }
  }

  const handleDelete = (id: number, title: string) => {
    setConfirmDialog({ title: '删除文章', message: `确定要删除「${title}」吗？`, danger: true, onConfirm: async () => {
      const token = getToken()
      if (!token) return
      try {
        const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
        if (res.ok) { showMsg('删除成功'); fetchStats(); fetchPosts(postPage) }
      } catch { showMsg('删除失败', 'error') }
    }})
  }

  const handleToggleTop = async (id: number, currentTop: boolean) => {
    const token = getToken()
    if (!token) return
    try {
      await fetch(`/api/admin/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isTop: !currentTop, topSort: !currentTop ? 1 : 0 }),
      })
      fetchPosts(postPage)
    } catch { showMsg('操作失败', 'error') }
  }

  const handleTopSort = async (id: number, topSort: number) => {
    const token = getToken()
    if (!token) return
    try {
      await fetch(`/api/admin/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ topSort }),
      })
      fetchPosts(postPage)
    } catch { showMsg('操作失败', 'error') }
  }

  const handleSaveUserRole = async (userId: number, newRole: string, permissions: string[], skipConfirm = false) => {
    const labels: Record<string, string> = { USER: '普通用户', ADMIN: '管理员', SUPER_ADMIN: '超级管理员' }
    if (!skipConfirm) {
      setConfirmDialog({ title: '修改角色', message: `确定将该用户设为「${labels[newRole] || newRole}」吗？`, onConfirm: () => handleSaveUserRole(userId, newRole, permissions, true) })
      return
    }
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, role: newRole, permissions }),
      })
      if (res.ok) { showMsg(skipConfirm ? '权限已保存' : `已设为${labels[newRole]}`); fetchUsers() }
      else { const data = await res.json(); showMsg(data.error || '操作失败', 'error') }
    } catch { showMsg('操作失败', 'error') }
  }

  const handleDeleteUser = (userId: number, username: string) => {
    setConfirmDialog({ title: '删除用户', message: `确定要删除用户「${username}」吗？其所有文章、评论、信访记录都将被删除，此操作不可撤销！`, danger: true, onConfirm: async () => {
      const token = getToken()
      if (!token) return
      try {
        const res = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ userId }),
        })
        if (res.ok) { showMsg('用户已删除'); fetchUsers(); fetchStats() }
        else { const data = await res.json(); showMsg(data.error || '删除失败', 'error') }
      } catch { showMsg('删除失败', 'error') }
    }})
  }

  const handleResetPassword = async (userId: number, username: string) => {
    const newPwd = prompt(`重置用户「${username}」的密码为：（至少6位）`, '123456')
    if (!newPwd) return
    if (newPwd.length < 6) { showMsg('密码长度至少6位', 'error'); return }
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch('/api/admin/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, newPassword: newPwd }),
      })
      if (res.ok) showMsg(`用户「${username}」密码已重置`)
      else { const data = await res.json(); showMsg(data.error || '重置失败', 'error') }
    } catch { showMsg('操作失败', 'error') }
  }

  const handleDeleteComment = (id: number) => {
    setConfirmDialog({ title: '删除评论', message: '确定要删除这条评论吗？', danger: true, onConfirm: async () => {
      const token = getToken()
      if (!token) return
      try {
        const res = await fetch('/api/admin/comments', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ id }),
        })
        if (res.ok) { showMsg('评论已删除'); fetchComments(commentPage); fetchStats() }
      } catch { showMsg('删除失败', 'error') }
    }})
  }

  // === Home Modules ===
  const saveHomeModules = async (mods: HomeModule[]) => {
    const token = getToken()
    if (!token) return
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ key: 'home_modules', value: JSON.stringify(mods), label: '首页模块配置' }),
      })
      showMsg('首页模块已保存，刷新首页生效')
    } catch { showMsg('保存失败', 'error') }
  }

  const addModule = (type: HomeModule['type']) => {
    const id = `mod_${Date.now()}`
    const typeMeta = MODULE_TYPES.find(t => t.value === type)
    const baseConfig: Record<string, string | number | boolean> = {}
    let width: HomeModule['width'] = 'half'
    let title = typeMeta?.label || '新模块'
    if (type === 'custom') {
      Object.assign(baseConfig, { htmlContent: '', linkUrl: '', linkText: '查看更多' })
      width = 'full'
    } else if (type === 'category_list') {
      Object.assign(baseConfig, { limit: 8, layout: 'default' })
    } else if (type === 'news_feed') {
      Object.assign(baseConfig, { limit: 8, layout: 'default' })
    } else if (type === 'latest_covers') {
      Object.assign(baseConfig, { limit: 5, layout: 'card' })
    } else if (type === 'banner') {
      width = 'two-thirds'
      title = '轮播横幅'
    } else if (type === 'quick_links') {
      width = 'full'
    }
    const newMod: HomeModule = { id, type, title, width, sort: homeModules.length + 1, visible: true, config: baseConfig }
    setHomeModules(prev => [...prev, newMod])
    setEditingModuleId(id)
    setShowModuleTypePicker(false)
  }

  const updateModule = (id: string, patch: Partial<HomeModule>) => {
    setHomeModules(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m))
  }

  const removeModule = (id: string) => {
    setConfirmDialog({ title: '删除模块', message: '确定要删除该模块吗？', danger: true, onConfirm: () => {
      const updated = homeModules.filter(m => m.id !== id)
      setHomeModules(updated)
      saveHomeModules(updated)
    }})
  }

  const moveModule = (id: string, dir: -1 | 1) => {
    const arr = [...homeModules].sort((a, b) => a.sort - b.sort)
    const idx = arr.findIndex(m => m.id === id)
    if (idx < 0) return
    const targetIdx = idx + dir
    if (targetIdx < 0 || targetIdx >= arr.length) return
    const tmp = arr[idx].sort
    arr[idx].sort = arr[targetIdx].sort
    arr[targetIdx].sort = tmp
    setHomeModules([...arr])
    saveHomeModules([...arr])
  }

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = getToken()
    if (!token) return
    try {
      const body: Record<string, unknown> = {
        name: menuForm.name,
        url: menuForm.url || null,
        sort: menuForm.sort,
        parentId: menuForm.parentId ? parseInt(menuForm.parentId) : null,
        visible: menuForm.visible,
      }
      const url = editingMenuId ? `/api/nav-menus/${editingMenuId}` : '/api/nav-menus'
      const method = editingMenuId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showMsg(editingMenuId ? '更新成功' : '创建成功')
        setMenuForm({ name: '', url: '', sort: 0, parentId: '', visible: true })
        setShowMenuForm(false)
        setEditingMenuId(null)
        fetchNavMenus()
      } else { const data = await res.json(); showMsg(data.error || '操作失败', 'error') }
    } catch { showMsg('网络错误', 'error') }
  }

  const handleEditMenu = (menu: NavMenuData) => {
    setEditingMenuId(menu.id)
    setMenuForm({ name: menu.name, url: menu.url || '', sort: menu.sort, parentId: menu.parentId ? String(menu.parentId) : '', visible: menu.visible })
    setShowMenuForm(true)
  }

  const handleDeleteMenu = (id: number, name: string) => {
    setConfirmDialog({ title: '删除菜单', message: `确定要删除「${name}」菜单吗？其子菜单也会被删除。`, danger: true, onConfirm: async () => {
      const token = getToken()
      if (!token) return
      try {
        const res = await fetch(`/api/nav-menus/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
        if (res.ok) { showMsg('删除成功'); fetchNavMenus() }
      } catch { showMsg('删除失败', 'error') }
    }})
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const token = getToken()
    if (!token) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData })
      if (res.ok) { const data = await res.json(); setCoverImage(data.url) }
    } catch { /* ignore */ }
    setUploading(false)
  }

  // === AI Functions ===
  const AI_PROVIDERS = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'], defaultBase: 'https://api.openai.com/v1' },
    { value: 'anthropic', label: 'Anthropic (Claude)', models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'], defaultBase: 'https://api.anthropic.com/v1' },
    { value: 'gemini', label: 'Google Gemini', models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'], defaultBase: 'https://generativelanguage.googleapis.com/v1beta' },
    { value: 'qwen', label: '通义千问 (Qwen)', models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long'], defaultBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
    { value: 'deepseek', label: 'DeepSeek', models: ['deepseek-chat', 'deepseek-reasoner'], defaultBase: 'https://api.deepseek.com' },
    { value: 'moonshot', label: '月之暗面 (Kimi)', models: ['moonshot-v1-128k', 'moonshot-v1-32k', 'moonshot-v1-8k'], defaultBase: 'https://api.moonshot.cn/v1' },
    { value: 'zhipu', label: '智谱 (GLM)', models: ['glm-4-plus', 'glm-4', 'glm-4-flash', 'glm-3-turbo'], defaultBase: 'https://open.bigmodel.cn/api/paas/v4' },
    { value: 'baidu', label: '百度文心一言', models: ['ernie-4.0-8k', 'ernie-3.5-8k', 'ernie-speed-128k'], defaultBase: '' },
    { value: 'custom', label: '自定义 (OpenAI兼容)', models: [], defaultBase: '' },
  ]

  const loadAiConfig = async (force = false) => {
    if (aiConfigLoaded && !force) return
    try {
      const res = await fetch('/api/settings?key=ai_config')
      if (res.ok) {
        const data = await res.json()
        if (data.value) {
          try {
            const parsed = JSON.parse(data.value)
            setAiConfig(prev => ({ ...prev, ...parsed }))
          } catch { /* ignore malformed config */ }
        }
      }
    } catch { /* ignore */ }
    setAiConfigLoaded(true)
  }

  const saveAiConfig = async () => {
    const token = getToken()
    if (!token) return false
    if (!aiConfig.apiKey.trim()) { showMsg('请填写 API Key', 'error'); return false }
    if (!aiConfig.model.trim()) { showMsg('请选择或填写模型名称', 'error'); return false }
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ key: 'ai_config', value: JSON.stringify(aiConfig), label: 'AI模型配置' }),
      })
      if (res.ok) {
        showMsg('AI 配置已保存')
        setAiTestResult(null)
        setAiConfigCollapsed(true)
        return true
      } else {
        const data = await res.json().catch(() => ({}))
        showMsg(data.error || '保存失败', 'error')
        return false
      }
    } catch { showMsg('网络错误', 'error'); return false }
  }

  const testAiConnection = async () => {
    // Auto-save config first so the API reads the latest values
    setAiTesting(true)
    setAiTestResult(null)
    const saved = await saveAiConfig()
    if (!saved) { setAiTesting(false); return }
    const token = getToken()
    if (!token) { setAiTesting(false); return }
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: '请回复"连接成功"四个字' }] }),
      })
      const data = await res.json()
      if (res.ok && data.content) {
        setAiTestResult({ ok: true, msg: `连接成功！模型回复: ${data.content.slice(0, 80)}` })
      } else {
        setAiTestResult({ ok: false, msg: data.error || '连接失败，请检查配置' })
      }
    } catch {
      setAiTestResult({ ok: false, msg: '网络错误，请检查网络连接' })
    }
    setAiTesting(false)
  }

  const aiChat = async (messages: { role: string; content: string }[], systemPrompt?: string, maxTokens?: number) => {
    const token = getToken()
    if (!token) return null
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ messages, systemPrompt, ...(maxTokens ? { maxTokens } : {}) }),
      })
      const data = await res.json()
      if (res.ok) return data.content as string
      showMsg(data.error || 'AI 请求失败', 'error')
      return null
    } catch {
      showMsg('AI 网络错误', 'error')
      return null
    }
  }

  // === AI Chat History Persistence ===
  const saveAiChatHistory = async (type: string, sessionId: string, messages: { role: string; content: string }[]) => {
    const token = getToken()
    if (!token || messages.length === 0) return
    try {
      await fetch('/api/ai/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type, sessionId, messages }),
      })
    } catch { /* silent fail */ }
  }

  const loadAiChatHistory = async (type: string): Promise<{ sessionId: string | null; messages: { role: string; content: string }[] }> => {
    const token = getToken()
    if (!token) return { sessionId: null, messages: [] }
    try {
      const res = await fetch(`/api/ai/history?type=${type}`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) return await res.json()
    } catch { /* silent fail */ }
    return { sessionId: null, messages: [] }
  }

  // === AI Layout Designer ===
  const openAiDesigner = () => {
    const catInfo = categories.map(c => `${c.name}(slug:${c.slug})`).join(', ')
    const currentLayout = homeModules.length > 0
      ? homeModules.map((m, i) => `${i + 1}. [${MODULE_TYPES.find(t => t.value === m.type)?.label || m.type}] ${m.title} (宽度:${WIDTH_OPTIONS.find(w => w.value === m.width)?.label || m.width}${m.category ? `, 分类:${m.category}` : ''})`).join('\n')
      : '暂无模块'
    setDesignerModules([...homeModules])
    setDesignerMessages([{
      role: 'assistant',
      content: `你好！我是 AI 布局设计师 🎨\n\n**当前首页已有 ${homeModules.length} 个模块：**\n${currentLayout}\n\n**可用分类：** ${catInfo}\n\n你可以告诉我：\n- 想要什么风格的首页？\n- 哪些分类需要重点展示？\n- 需要增加、删除或调整哪些模块？\n- 或者让我直接生成一套新方案\n\n右侧面板可以实时拖拽调整模块顺序和宽度。`
    }])
    setDesignerInput('')
    setShowAiDesigner(true)
  }

  const designerSend = async () => {
    if (!designerInput.trim() || designerGenerating) return
    const newMessages = [...designerMessages, { role: 'user', content: designerInput }]
    setDesignerMessages(newMessages)
    setDesignerInput('')
    setDesignerGenerating(true)

    const catInfo = categories.map(c => `${c.name}(slug:${c.slug})`).join(', ')
    const currentModulesDesc = designerModules.map((m, i) => `${i + 1}.[${m.type}]${m.title}(width:${m.width}${m.category ? ',cat:' + m.category : ''})`).join('; ')
    const systemPrompt = `你是门户网站首页布局设计师。
可用模块类型: banner(轮播横幅), category_list(分类文章), image_grid(热点图片), top_headline(今日头条), latest_covers(图文列表), news_feed(综合快讯), quick_links(快捷导航), custom(自定义HTML)
可用宽度: full(整行), two-thirds(2/3), half(1/2), third(1/3)
网站分类: ${catInfo}
当前布局: ${currentModulesDesc || '空'}

职责:
1. 根据用户需求调整或重新设计首页模块布局
2. 当需要生成/更新布局时，输出JSON数组用\`\`\`json包裹。每个模块: {id(字符串),type,title(中文),category(分类slug),width,sort(数字),visible(true),config(对象)}
3. 先描述设计思路，再输出JSON
4. category_list类型必须有category字段，值为分类slug
5. 生成前要确认用户需求

用中文回答，简洁专业。`

    const result = await aiChat(newMessages, systemPrompt)
    if (result) {
      const updated = [...newMessages, { role: 'assistant', content: result }]
      setDesignerMessages(updated)
      saveAiChatHistory('designer', designerSessionId, updated)
      // Auto-detect layout JSON and update right panel
      const mods = extractLayoutJson(result)
      if (mods) setDesignerModules(mods)
    } else {
      const updated = [...newMessages, { role: 'assistant', content: '⚠️ 请求失败，请检查 AI 配置。' }]
      setDesignerMessages(updated)
      saveAiChatHistory('designer', designerSessionId, updated)
    }
    setDesignerGenerating(false)
  }

  const designerApply = () => {
    if (designerModules.length === 0) { showMsg('没有可应用的模块', 'error'); return }
    setHomeModules(designerModules)
    saveHomeModules(designerModules)
    showMsg(`已应用 ${designerModules.length} 个模块到首页`)
    setShowAiDesigner(false)
  }

  useEffect(() => {
    designerChatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [designerMessages, designerGenerating])

  const extractLayoutJson = (text: string): HomeModule[] | null => {
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/)
      if (jsonMatch) {
        const arr = JSON.parse(jsonMatch[1])
        if (Array.isArray(arr) && arr.length > 0 && arr[0].type) return arr
      }
      // Try parsing the whole text as JSON
      const trimmed = text.trim()
      if (trimmed.startsWith('[')) {
        const arr = JSON.parse(trimmed)
        if (Array.isArray(arr) && arr.length > 0 && arr[0].type) return arr
      }
    } catch { /* not valid layout JSON */ }
    return null
  }

  const [aiEditLoading, setAiEditLoading] = useState<string | null>(null)

  const aiEditGenerate = async () => {
    if (!editForm.title.trim()) { showMsg('请先输入标题', 'error'); return }
    setAiEditLoading('article')
    const catName = categories.find(c => String(c.id) === editForm.categoryId)?.name || ''
    const result = await aiChat(
      [{ role: 'user', content: `请根据标题「${editForm.title}」写一篇${catName ? `属于"${catName}"分类的` : ''}文章。要求：正文800-1500字，语言正式专业，结构清晰。直接返回正文。` }],
      '你是门户网站内容编辑。直接输出文章正文，不要任何前缀说明。'
    )
    if (result) setEditForm(prev => ({ ...prev, content: result }))
    else showMsg('AI 生成失败', 'error')
    setAiEditLoading(null)
  }

  const aiEditPolish = async () => {
    if (!editForm.content.trim()) { showMsg('请先输入内容', 'error'); return }
    setAiEditLoading('polish')
    const result = await aiChat(
      [{ role: 'user', content: `请润色优化以下文章，使其更通顺、专业，保持原意不变：\n\n${editForm.content}` }],
      '你是文字润色专家。直接返回润色后的全文，不要任何说明。'
    )
    if (result) setEditForm(prev => ({ ...prev, content: result }))
    else showMsg('AI 润色失败', 'error')
    setAiEditLoading(null)
  }

  const aiEditSummary = async () => {
    if (!editForm.content.trim()) { showMsg('请先输入内容', 'error'); return }
    setAiEditLoading('summary')
    const result = await aiChat(
      [{ role: 'user', content: `请为以下文章生成一句话摘要（30-80字）：\n\n${editForm.content.slice(0, 2000)}` }],
      '你是摘要生成器。只返回摘要文字，不要任何前缀。'
    )
    if (result) setEditForm(prev => ({ ...prev, summary: result.replace(/^["「]|["」]$/g, '') }))
    else showMsg('AI 生成失败', 'error')
    setAiEditLoading(null)
  }

  const aiEditTitle = async () => {
    if (!editForm.content.trim()) { showMsg('请先输入内容', 'error'); return }
    setAiEditLoading('title')
    const result = await aiChat(
      [{ role: 'user', content: `请根据以下文章内容生成一个精炼的标题（10-25字）：\n\n${editForm.content.slice(0, 1500)}` }],
      '你是标题生成器。只返回标题文字，不要引号和任何前缀。'
    )
    if (result) setEditForm(prev => ({ ...prev, title: result.replace(/^["「『]|["」』]$/g, '').trim() }))
    else showMsg('AI 生成失败', 'error')
    setAiEditLoading(null)
  }

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiChatMessages, aiChatGenerating])

  const aiSendChat = async () => {
    if (!aiChatInput.trim()) return
    const newMessages = [...aiChatMessages, { role: 'user', content: aiChatInput }]
    setAiChatMessages(newMessages)
    setAiChatInput('')
    setAiChatGenerating(true)

    const catInfo = categories.map(c => `${c.name}(slug:${c.slug})`).join(', ')
    const systemPrompt = `你是门户网站智能助手。你可以帮助管理员：
1. 设计首页布局——通过对话了解需求后，生成首页模块布局JSON
2. 生成美观的HTML模块代码（使用内联CSS，主题色${currentThemeHex}）
3. 回答网站管理相关问题
4. 生成各种HTML内容（Banner、导航、公告栏、统计面板等）

当前网站分类: ${catInfo}

当用户要求生成首页布局时：
- 先了解用户的需求和偏好（风格、重点展示的分类、特殊模块等）
- 确认需求后，生成布局JSON。格式为纯JSON数组，每个模块包含: id(字符串), type(banner|category_list|image_grid|top_headline|latest_covers|news_feed|quick_links|custom), title(中文), category(分类slug), width(full|half|third|two-thirds), sort(数字), visible(true), config(对象)
- JSON用\`\`\`json代码块包裹
- 生成前要告诉用户你的设计思路

当用户要求生成HTML时：
- 直接返回完整的HTML代码，使用内联CSS，主题色${currentThemeHex}，响应式设计
- HTML代码必须用\`\`\`html代码块包裹
- 必须确保HTML完整闭合，不能截断（包括所有</style>、</head>、</body>、</html>标签）
- 如果内容较多，优先精简CSS，确保生成完整
- 图片使用 picsum.photos 随机图片或 placeholder

请用中文回答，简洁专业。`

    // Use higher maxTokens when user likely wants HTML generation
    const needsMoreTokens = /html|网页|页面|模块|组件|banner|卡片|表格|面板|写一个|生成|活动|方案|展示|评论|配图/.test(aiChatInput)
    const result = await aiChat(newMessages, systemPrompt, needsMoreTokens ? 8192 : undefined)
    if (result) {
      const updated = [...newMessages, { role: 'assistant', content: result }]
      setAiChatMessages(updated)
      saveAiChatHistory('chat', aiChatSessionId, updated)
    } else {
      const updated = [...newMessages, { role: 'assistant', content: '⚠️ 请求失败，请检查 AI 配置是否正确。' }]
      setAiChatMessages(updated)
      saveAiChatHistory('chat', aiChatSessionId, updated)
    }
    setAiChatGenerating(false)
  }

  if (!user) return null

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const userPerms = user?.permissions || []
  const hasPerm = (mod: string) => isSuperAdmin || userPerms.includes(mod) || userPerms.some(p => p.startsWith(mod + ':'))
  const allowedCategories = (mod: string) => {
    if (isSuperAdmin || userPerms.includes(mod)) return categories
    const slugs = userPerms.filter(p => p.startsWith(mod + ':')).map(p => p.split(':')[1])
    return categories.filter(c => slugs.includes(c.slug))
  }

  type TabKey = 'overview' | 'posts' | 'comments' | 'users' | 'menus' | 'settings'
  const tabPermMap: Record<TabKey, string> = {
    overview: 'publish', posts: 'posts', comments: 'comments',
    users: 'users', menus: 'menus', settings: 'settings',
  }
  const allTabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: '发布文章' },
    { key: 'posts', label: `文章管理 (${stats.postCount})` },
    { key: 'comments', label: `评论管理 (${stats.commentCount})` },
    { key: 'users', label: `用户管理 (${stats.userCount})` },
    { key: 'menus', label: `导航管理` },
    { key: 'settings', label: `站点设置` },
  ]
  const tabs = allTabs.filter(t => hasPerm(tabPermMap[t.key]))

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">管理中心</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">欢迎回来，{user?.username}</p>
        </div>
        <Link href="/" className="text-xs text-gray-500 hover:text-bank-red transition-colors flex items-center gap-1"><ChevronLeft size={12} />返回首页</Link>
      </div>

      {message && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-[slideDown_0.3s_ease-out]">
          <div className={`px-6 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 backdrop-blur-sm ${msgType === 'success' ? 'bg-green-600/95 text-white' : 'bg-red-600/95 text-white'}`}>
            <span className="text-base">{msgType === 'success' ? '✓' : '✕'}</span>
            {message}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { icon: <FileText size={18} />, bg: 'bg-blue-50', fg: 'text-blue-500', ring: 'ring-blue-100', label: '文章', value: stats.postCount },
          { icon: <Users size={18} />, bg: 'bg-emerald-50', fg: 'text-emerald-500', ring: 'ring-emerald-100', label: '用户', value: stats.userCount },
          { icon: <BarChart3 size={18} />, bg: 'bg-amber-50', fg: 'text-amber-500', ring: 'ring-amber-100', label: '浏览', value: stats.totalViews },
          { icon: <MessageSquare size={18} />, bg: 'bg-purple-50', fg: 'text-purple-500', ring: 'ring-purple-100', label: '评论', value: stats.commentCount },
        ].map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-3.5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center ${s.fg} ring-1 ${s.ring}`}>{s.icon}</div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100 tabular-nums">{s.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b bg-gray-50/60 dark:bg-gray-800/60 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-5 py-3 text-xs font-medium border-b-2 -mb-px transition-all whitespace-nowrap ${activeTab === t.key ? 'border-bank-red text-bank-red bg-white dark:bg-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: 发布文章 */}
        {activeTab === 'overview' && (
          <div>
            {/* 工具栏 */}
            <div className="px-5 py-3.5 border-b bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-800/50 dark:to-gray-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-gray-500">共 <span className="font-bold text-gray-700 dark:text-gray-200">{myPostTotal}</span> 篇</span>
                <select value={myPostCategory}
                  onChange={e => { setMyPostCategory(e.target.value); fetchMyPosts(1, myPostSearch, e.target.value) }}
                  className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-bank-red/20 focus:border-bank-red outline-none bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">
                  <option value="">全部分类</option>
                  {allowedCategories('publish').map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={myPostSearch} onChange={e => {
                    setMyPostSearch(e.target.value)
                    if (myPostSearchTimer.current) clearTimeout(myPostSearchTimer.current)
                    myPostSearchTimer.current = setTimeout(() => fetchMyPosts(1, e.target.value), 400)
                  }} placeholder="搜索标题..."
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-bank-red/20 focus:border-bank-red outline-none bg-white dark:bg-gray-800 dark:border-gray-600" />
                </div>
                <Link href="/post/create" className="btn-red text-xs px-4 py-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg shadow-sm hover:shadow transition-shadow">
                  <Plus size={13} />发布新文章
                </Link>
              </div>
            </div>

            {/* 编辑弹窗 */}
            {editingPost && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingPost(null)}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                  <div className="px-5 py-3.5 border-b flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-t-xl">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">编辑文章</h3>
                    <button onClick={() => setEditingPost(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"><X size={16} /></button>
                  </div>
                  <form onSubmit={handleEditPost} className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-gray-500">标题 *</label>
                        <button type="button" onClick={aiEditTitle} disabled={!!aiEditLoading}
                          className="text-[10px] text-purple-500 hover:text-purple-700 flex items-center gap-1 disabled:opacity-40">
                          <Sparkles size={10} />{aiEditLoading === 'title' ? '生成中...' : 'AI标题'}
                        </button>
                      </div>
                      <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-bank-red outline-none" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">分类 *</label>
                        <select value={editForm.categoryId} onChange={e => setEditForm({ ...editForm, categoryId: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-bank-red outline-none" required>
                          <option value="">选择分类</option>
                          {allowedCategories('publish').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-gray-500">摘要</label>
                          <button type="button" onClick={aiEditSummary} disabled={!!aiEditLoading}
                            className="text-[10px] text-purple-500 hover:text-purple-700 flex items-center gap-1 disabled:opacity-40">
                            <Sparkles size={10} />{aiEditLoading === 'summary' ? '生成中...' : 'AI摘要'}
                          </button>
                        </div>
                        <input type="text" value={editForm.summary} onChange={e => setEditForm({ ...editForm, summary: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-bank-red outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">封面图片 URL</label>
                      <input type="text" value={editForm.coverImage} onChange={e => setEditForm({ ...editForm, coverImage: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-bank-red outline-none"
                        placeholder="留空则无封面" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-gray-500">内容 (HTML) *</label>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={aiEditGenerate} disabled={!!aiEditLoading}
                            className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center gap-1 disabled:opacity-40 transition-colors">
                            <Sparkles size={10} />{aiEditLoading === 'article' ? '生成中...' : 'AI写文章'}
                          </button>
                          <button type="button" onClick={aiEditPolish} disabled={!!aiEditLoading}
                            className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center gap-1 disabled:opacity-40 transition-colors">
                            <Wand2 size={10} />{aiEditLoading === 'polish' ? '润色中...' : 'AI润色'}
                          </button>
                        </div>
                      </div>
                      <textarea value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-bank-red outline-none resize-none font-mono" rows={14} required />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="submit" className="btn-red text-xs px-5 py-1.5">保存修改</button>
                      <button type="button" onClick={() => setEditingPost(null)} className="px-4 py-1.5 border rounded text-xs hover:bg-gray-50">取消</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 文章列表 */}
            {myPosts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {myPosts.map((p, idx) => (
                  <div key={p.id} className={`px-5 py-3.5 flex items-center gap-4 group transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/30 dark:bg-gray-800/30'} hover:bg-blue-50/40`}>
                    {p.coverImage && (
                      <img src={p.coverImage} alt="" className="w-16 h-12 object-cover rounded border flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Link href={`/post/${p.id}`} className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-bank-red truncate">
                          {p.title}
                        </Link>
                        {p.isTop && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">置顶</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400">
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{p.category.name}</span>
                        <span>{new Date(p.createdAt).toLocaleDateString('zh-CN')}</span>
                        <span className="flex items-center gap-0.5"><Eye size={10} />{p.viewCount}</span>
                        <span className="flex items-center gap-0.5"><MessageSquare size={10} />{p._count.comments}</span>
                      </div>
                    </div>
                    <button onClick={() => {
                      setEditingPost(p)
                      setEditForm({
                        title: p.title,
                        content: p.content || '',
                        summary: p.summary || '',
                        categoryId: String(p.categoryId),
                        coverImage: p.coverImage || '',
                      })
                    }} className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100" title="编辑">
                      <Edit size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <FileText size={36} className="mx-auto text-gray-200 mb-3" />
                <p className="text-xs text-gray-400">{myPostSearch || myPostCategory ? '没有找到匹配的文章' : '您还没有发布过文章'}</p>
              </div>
            )}

            {/* 分页 */}
            {myPostTotalPages > 1 && (
              <div className="px-4 py-3 border-t bg-gray-50/50 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  第 {(myPostPage - 1) * MY_POST_PAGE_SIZE + 1}-{Math.min(myPostPage * MY_POST_PAGE_SIZE, myPostTotal)} 条，共 {myPostTotal} 条
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => fetchMyPosts(1)} disabled={myPostPage <= 1}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronsLeft size={14} /></button>
                  <button onClick={() => fetchMyPosts(myPostPage - 1)} disabled={myPostPage <= 1}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={14} /></button>
                  {Array.from({ length: Math.min(5, myPostTotalPages) }, (_, i) => {
                    let p: number
                    if (myPostTotalPages <= 5) p = i + 1
                    else if (myPostPage <= 3) p = i + 1
                    else if (myPostPage >= myPostTotalPages - 2) p = myPostTotalPages - 4 + i
                    else p = myPostPage - 2 + i
                    return (
                      <button key={p} onClick={() => fetchMyPosts(p)}
                        className={`min-w-[32px] h-8 rounded-md text-xs font-medium transition-colors ${p === myPostPage ? 'bg-bank-red text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                        {p}
                      </button>
                    )
                  })}
                  <button onClick={() => fetchMyPosts(myPostPage + 1)} disabled={myPostPage >= myPostTotalPages}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={14} /></button>
                  <button onClick={() => fetchMyPosts(myPostTotalPages)} disabled={myPostPage >= myPostTotalPages}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronsRight size={14} /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: 文章管理 */}
        {activeTab === 'posts' && (
          <div>
            {/* Toolbar */}
            <div className="px-4 py-3 border-b bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">共 <span className="font-semibold text-gray-700">{postTotal}</span> 篇文章</span>
                <select value={postCategoryFilter}
                  onChange={e => { setPostCategoryFilter(e.target.value); fetchPosts(1, postSearch, e.target.value) }}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-bank-red/30 focus:border-bank-red outline-none bg-white">
                  <option value="">全部分类</option>
                  {allowedCategories('posts').map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" value={postSearch} onChange={e => {
                    setPostSearch(e.target.value)
                    if (postSearchTimer.current) clearTimeout(postSearchTimer.current)
                    postSearchTimer.current = setTimeout(() => fetchPosts(1, e.target.value), 400)
                  }}
                  placeholder="搜索标题或作者..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-bank-red/30 focus:border-bank-red outline-none bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">标题</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">分类</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">作者</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">浏览</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">评论</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">状态</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">排序</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">发布时间</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {posts.map((post, idx) => (
                    <tr key={post.id} className={`group transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-blue-50/40`}>
                      <td className="px-4 py-3 max-w-[320px]">
                        <Link href={`/post/${post.id}`} className="text-sm text-gray-800 hover:text-bank-red transition-colors line-clamp-1 font-medium">
                          {post.title}
                        </Link>
                        <span className="text-[10px] text-gray-400 ml-1">#{post.id}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600">{post.category.name}</span>
                      </td>
                      <td className="px-3 py-3 text-gray-500 text-[11px]">{post.author.username}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-0.5 text-gray-400 text-[11px]"><Eye size={11} />{post.viewCount}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-0.5 text-gray-400 text-[11px]"><MessageSquare size={10} />{post._count.comments}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button onClick={() => handleToggleTop(post.id, post.isTop)}
                          className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${post.isTop ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'}`}>
                          {post.isTop ? '★ 置顶' : '置顶'}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {post.isTop ? (
                          <input type="number" value={post.topSort}
                            onChange={(e) => handleTopSort(post.id, parseInt(e.target.value) || 0)}
                            className="w-14 px-1.5 py-1 text-center text-[11px] border border-gray-200 rounded-md focus:ring-2 focus:ring-bank-red/30 focus:border-bank-red outline-none"
                            title="数字越大排越前" />
                        ) : (
                          <span className="text-gray-300 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-400 whitespace-nowrap text-[11px]">{new Date(post.createdAt).toLocaleDateString('zh-CN')}</td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/post/${post.id}`}
                            className="p-1.5 rounded-md hover:bg-blue-100 text-blue-500 transition-colors" title="编辑">
                            <Edit size={13} />
                          </Link>
                          <button onClick={() => handleDelete(post.id, post.title)}
                            className="p-1.5 rounded-md hover:bg-red-100 text-red-400 transition-colors" title="删除">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {posts.length === 0 && <div className="p-16 text-center text-gray-400 text-xs"><FileText size={32} className="mx-auto mb-3 text-gray-200" /><p>暂无文章数据</p></div>}
            </div>

            {/* Pagination */}
            {postTotalPages > 1 && (
              <div className="px-4 py-3 border-t bg-gray-50/50 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  第 {(postPage - 1) * POST_PAGE_SIZE + 1}-{Math.min(postPage * POST_PAGE_SIZE, postTotal)} 条，共 {postTotal} 条
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => fetchPosts(1)} disabled={postPage <= 1}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronsLeft size={14} />
                  </button>
                  <button onClick={() => fetchPosts(postPage - 1)} disabled={postPage <= 1}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(5, postTotalPages) }, (_, i) => {
                    let p: number
                    if (postTotalPages <= 5) p = i + 1
                    else if (postPage <= 3) p = i + 1
                    else if (postPage >= postTotalPages - 2) p = postTotalPages - 4 + i
                    else p = postPage - 2 + i
                    return (
                      <button key={p} onClick={() => fetchPosts(p)}
                        className={`min-w-[32px] h-8 rounded-md text-xs font-medium transition-colors ${p === postPage ? 'bg-bank-red text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                        {p}
                      </button>
                    )
                  })}
                  <button onClick={() => fetchPosts(postPage + 1)} disabled={postPage >= postTotalPages}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={14} />
                  </button>
                  <button onClick={() => fetchPosts(postTotalPages)} disabled={postPage >= postTotalPages}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronsRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: 评论管理 */}
        {activeTab === 'comments' && (
          <div>
            {/* Toolbar */}
            <div className="px-4 py-3 border-b bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-gray-500">共 <span className="font-semibold text-gray-700">{commentTotal}</span> 条评论</span>
                <select value={commentCategoryFilter}
                  onChange={e => { setCommentCategoryFilter(e.target.value); setCommentPostFilter(''); fetchComments(1, commentSearch, '', e.target.value) }}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-bank-red/30 focus:border-bank-red outline-none bg-white">
                  <option value="">全部分类</option>
                  {allowedCategories('comments').map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
                <select value={commentPostFilter}
                  onChange={e => { setCommentPostFilter(e.target.value); fetchComments(1, commentSearch, e.target.value) }}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-bank-red/30 focus:border-bank-red outline-none bg-white max-w-[200px]">
                  <option value="">全部文章</option>
                  {allPostTitles.map(p => <option key={p.id} value={p.id}>#{p.id} {p.title.length > 15 ? p.title.slice(0, 15) + '...' : p.title}</option>)}
                </select>
              </div>
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" value={commentSearch} onChange={e => {
                    setCommentSearch(e.target.value)
                    if (commentSearchTimer.current) clearTimeout(commentSearchTimer.current)
                    commentSearchTimer.current = setTimeout(() => fetchComments(1, e.target.value), 400)
                  }}
                  placeholder="搜索评论内容、作者或文章..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-bank-red/30 focus:border-bank-red outline-none bg-white"
                />
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {comments.map((c, idx) => (
                <div key={c.id} className={`px-4 py-3.5 flex items-start gap-3 group transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-blue-50/40`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mt-0.5">
                    {c.author.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700">{c.author.username}</span>
                      <span className="text-[10px] text-gray-400">评论了</span>
                      <Link href={`/post/${c.post.id}`} className="text-[11px] text-bank-red hover:underline line-clamp-1 max-w-[300px]">
                        {c.post.title}
                      </Link>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-1.5">{c.content}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleString('zh-CN')}</span>
                      <span className="text-[10px] text-gray-300">#{c.id}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteComment(c.id)}
                    className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" title="删除评论">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="p-16 text-center text-gray-400 text-xs">
                  <MessageSquare size={32} className="mx-auto mb-3 text-gray-200" />
                  <p>暂无评论数据</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {commentTotalPages > 1 && (
              <div className="px-4 py-3 border-t bg-gray-50/50 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  第 {(commentPage - 1) * COMMENT_PAGE_SIZE + 1}-{Math.min(commentPage * COMMENT_PAGE_SIZE, commentTotal)} 条，共 {commentTotal} 条
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => fetchComments(1)} disabled={commentPage <= 1}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronsLeft size={14} />
                  </button>
                  <button onClick={() => fetchComments(commentPage - 1)} disabled={commentPage <= 1}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(5, commentTotalPages) }, (_, i) => {
                    let p: number
                    if (commentTotalPages <= 5) p = i + 1
                    else if (commentPage <= 3) p = i + 1
                    else if (commentPage >= commentTotalPages - 2) p = commentTotalPages - 4 + i
                    else p = commentPage - 2 + i
                    return (
                      <button key={p} onClick={() => fetchComments(p)}
                        className={`min-w-[32px] h-8 rounded-md text-xs font-medium transition-colors ${p === commentPage ? 'bg-bank-red text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                        {p}
                      </button>
                    )
                  })}
                  <button onClick={() => fetchComments(commentPage + 1)} disabled={commentPage >= commentTotalPages}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={14} />
                  </button>
                  <button onClick={() => fetchComments(commentTotalPages)} disabled={commentPage >= commentTotalPages}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronsRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: 导航管理 */}
        {activeTab === 'menus' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-sm text-gray-700 dark:text-gray-200">导航菜单配置</h2>
                <p className="text-[10px] text-gray-400 mt-0.5">配置网站顶部导航栏菜单项，支持多级嵌套</p>
              </div>
              <button onClick={() => { setShowMenuForm(!showMenuForm); setEditingMenuId(null); setMenuForm({ name: '', url: '', sort: 0, parentId: '', visible: true }) }}
                className="btn-red text-xs px-4 py-2 flex items-center gap-1.5 rounded-lg shadow-sm hover:shadow transition-shadow">
                <Plus size={13} />{showMenuForm ? '取消' : '添加菜单'}
              </button>
            </div>

            {showMenuForm && (
              <form onSubmit={handleCreateMenu} className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-5 mb-4 space-y-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">名称 *</label>
                    <input type="text" value={menuForm.name} onChange={e => setMenuForm({ ...menuForm, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-bank-red outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">链接地址（选择预设或手动输入）</label>
                    <div className="flex gap-2">
                      <select value="" onChange={e => { if (e.target.value) setMenuForm(prev => ({ ...prev, url: e.target.value })) }}
                        className="w-40 px-2 py-2 border rounded text-xs focus:ring-2 focus:ring-bank-red outline-none bg-white text-gray-500 flex-shrink-0">
                        <option value="">快速选择...</option>
                        <optgroup label="页面">
                          <option value="/">首页</option>
                          {categories.map(c => <option key={c.id} value={`/category/${c.slug}`}>{c.name}</option>)}
                          <option value="/petition">信息查询</option>
                          <option value="/search">搜索</option>
                          <option value="/admin">管理中心</option>
                        </optgroup>
                        {homeModules.filter(m => m.visible).length > 0 && (
                          <optgroup label="首页模块锚点">
                            {homeModules.filter(m => m.visible).sort((a, b) => a.sort - b.sort).map(m => {
                              const anchor = (m.config?.slug as string) || m.id
                              return <option key={m.id} value={`/#${anchor}`}>{m.title || MODULE_TYPES.find(t => t.value === m.type)?.label}</option>
                            })}
                          </optgroup>
                        )}
                      </select>
                      <input type="text" value={menuForm.url} onChange={e => setMenuForm({ ...menuForm, url: e.target.value })}
                        className="flex-1 px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-bank-red outline-none font-mono" placeholder="/path 或 https://..." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">父菜单</label>
                    <select value={menuForm.parentId} onChange={e => setMenuForm({ ...menuForm, parentId: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-bank-red outline-none">
                      <option value="">顶级菜单</option>
                      {navMenus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">排序</label>
                      <input type="number" value={menuForm.sort} onChange={e => setMenuForm({ ...menuForm, sort: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-bank-red outline-none" />
                    </div>
                    <label className="flex items-center gap-1.5 text-xs pb-2.5 whitespace-nowrap">
                      <input type="checkbox" checked={menuForm.visible} onChange={e => setMenuForm({ ...menuForm, visible: e.target.checked })} className="rounded" />显示
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="btn-red text-xs px-6 py-2 rounded-lg shadow-sm hover:shadow transition-shadow">{editingMenuId ? '保存修改' : '添加菜单'}</button>
                  <button type="button" onClick={() => { setShowMenuForm(false); setEditingMenuId(null) }} className="px-5 py-2 border rounded-lg text-xs hover:bg-gray-50 text-gray-500 transition-colors">取消</button>
                </div>
              </form>
            )}

            {navMenus.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <Navigation size={28} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-500">暂未配置导航菜单</p>
                <p className="mt-1 text-[11px] text-gray-400">添加菜单后将替换默认的固定导航栏</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {navMenus.map(menu => (
                  <div key={menu.id} className="border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                      <div className="flex items-center gap-3 min-w-0">
                        <GripVertical size={14} className="text-gray-300 flex-shrink-0 cursor-grab" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{menu.name}</span>
                        {menu.url ? (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 flex items-center gap-1 font-mono">
                            <ExternalLink size={9} />{menu.url}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 dark:bg-gray-700">无链接</span>
                        )}
                        {!menu.visible && <span className="text-[9px] bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full border border-yellow-100">隐藏</span>}
                        <span className="text-[10px] text-gray-300">#{menu.sort}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditMenu(menu)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="编辑"><Edit size={13} /></button>
                        <button onClick={() => handleDeleteMenu(menu.id, menu.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="删除"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    {menu.children.length > 0 && (
                      <div className="divide-y divide-gray-50 dark:divide-gray-800 border-t border-gray-100 dark:border-gray-700">
                        {menu.children.map(child => (
                          <div key={child.id} className="flex items-center justify-between px-4 py-2.5 pl-11 hover:bg-blue-50/30 dark:hover:bg-gray-800/50 transition-colors group">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0"></span>
                              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{child.name}</span>
                              {child.url ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 flex items-center gap-1 font-mono">
                                  <ExternalLink size={9} />{child.url}
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 dark:bg-gray-700">无链接</span>
                              )}
                              {!child.visible && <span className="text-[9px] bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded-full border border-yellow-100">隐藏</span>}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEditMenu(child)} className="p-1 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><Edit size={12} /></button>
                              <button onClick={() => handleDeleteMenu(child.id, child.name)} className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: 用户管理 */}
        {activeTab === 'settings' && (
          <div className="p-5">
            <div className="mb-5">
              <h2 className="font-bold text-sm text-gray-700 dark:text-gray-200">站点设置</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">配置网站品牌、路由、首页模块和其他全局设置</p>
            </div>
            <div className="space-y-6">

              {/* Site Branding Settings */}
              <div className="border dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-900">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">站点品牌配置</h3>
                <p className="text-[10px] text-gray-400 mb-4">修改后刷新页面即可看到效果（Header / Footer / 登录页等均会动态读取）</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'site_name', label: '站点名称', placeholder: '如：企业门户网站' },
                    { key: 'site_short_name', label: '站点简称', placeholder: '如：企业门户' },
                    { key: 'site_logo_text', label: 'Logo文字', placeholder: '如：EP' },
                    { key: 'site_logo_subtitle', label: 'Logo副标题', placeholder: '如：ENTERPRISE PORTAL' },
                    { key: 'site_description', label: '站点描述', placeholder: '用于登录页和SEO描述' },
                    { key: 'site_hotline', label: '客服热线', placeholder: '留空则不显示' },
                    { key: 'site_copyright', label: '版权信息', placeholder: '留空使用默认' },
                    { key: 'site_icp', label: 'ICP备案号', placeholder: '留空则不显示' },
                  ].map(item => (
                    <div key={item.key}>
                      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{item.label}</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={siteSettings[item.key] || ''}
                          onChange={e => setSiteSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
                          placeholder={item.placeholder}
                          className="flex-1 px-3 py-1.5 border rounded text-xs focus:outline-none focus:border-bank-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        />
                        <button
                          onClick={() => saveSiteSetting(item.key, siteSettings[item.key] || '', item.label)}
                          className="bg-bank-primary text-white text-xs px-3 py-1.5 rounded hover:bg-bank-dark transition-colors whitespace-nowrap"
                        >保存</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 可用路由总览 */}
              <div className="border dark:border-gray-700 rounded-xl p-5 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-gray-900">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">可用路由总览</h3>
                <p className="text-[10px] text-gray-400 mb-4">以下路由可用于导航菜单配置，点击即可复制地址</p>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-gray-500 font-medium">页面路由</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {[
                        { path: '/', label: '首页' },
                        ...categories.map(c => ({ path: `/category/${c.slug}`, label: c.name })),
                        { path: '/petition', label: '信息查询' },
                        { path: '/search', label: '搜索' },
                        { path: '/admin', label: '管理中心' },
                      ].map(r => (
                        <button key={r.path} type="button" onClick={() => { navigator.clipboard.writeText(r.path); showMsg(`已复制: ${r.path}`) }}
                          className="text-[10px] px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors cursor-pointer">
                          {r.label} <span className="text-gray-400 font-mono ml-0.5">{r.path}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {homeModules.filter(m => m.visible).length > 0 && (
                    <div>
                      <span className="text-[10px] text-gray-500 font-medium">首页模块锚点</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {homeModules.filter(m => m.visible).sort((a, b) => a.sort - b.sort).map(m => {
                          const anchor = (m.config?.slug as string) || m.id
                          const url = `/#${anchor}`
                          return (
                            <button key={m.id} type="button" onClick={() => { navigator.clipboard.writeText(url); showMsg(`已复制: ${url}`) }}
                              className="text-[10px] px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors cursor-pointer">
                              {m.title || MODULE_TYPES.find(t => t.value === m.type)?.label} <span className="text-gray-400 font-mono ml-0.5">{url}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Homepage Module Config */}
              <div className="border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => setModulesCollapsed(prev => !prev)}>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">首页模块配置</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 font-medium">
                      {homeModules.length} 个模块 · {homeModules.filter(m => m.visible).length} 个显示
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {modulesCollapsed && aiConfigLoaded && aiConfig.apiKey && (
                      <button onClick={(e) => { e.stopPropagation(); openAiDesigner() }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors font-medium flex items-center gap-1.5">
                        <Sparkles size={12} />AI 设计
                      </button>
                    )}
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${modulesCollapsed ? '' : 'rotate-180'}`} />
                  </div>
                </div>

                <div className={`${modulesCollapsed ? 'hidden' : ''} px-5 pb-5`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400">排序、增删模块，点击编辑配置后保存即生效。</p>
                  <div className="flex items-center gap-2">
                    {aiConfigLoaded && aiConfig.apiKey && (
                      <button onClick={openAiDesigner}
                        className="text-xs px-4 py-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors font-medium flex items-center gap-1.5">
                        <Sparkles size={12} />AI 布局设计器
                      </button>
                    )}
                    <button onClick={() => setShowModuleTypePicker(true)} className="text-xs px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium">+ 添加模块</button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {[...homeModules].sort((a, b) => a.sort - b.sort).map((mod) => {
                    const modAnchor = (mod.config?.slug as string) || mod.id
                    return (
                    <div key={mod.id} className={`border rounded-xl transition-all ${mod.visible ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow' : 'bg-gray-50 dark:bg-gray-900 border-dashed border-gray-300 dark:border-gray-600 opacity-60'}`}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveModule(mod.id, -1)} className="text-gray-400 hover:text-gray-600 text-xs leading-none">▲</button>
                          <button onClick={() => moveModule(mod.id, 1)} className="text-gray-400 hover:text-gray-600 text-xs leading-none">▼</button>
                        </div>
                        <GripVertical size={16} className="text-gray-300 flex-shrink-0 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate block">
                            {mod.title || MODULE_TYPES.find(t => t.value === mod.type)?.label || mod.type}
                          </span>
                          <button type="button" onClick={() => { navigator.clipboard.writeText(`/#${modAnchor}`); showMsg(`已复制: /#${modAnchor}`) }}
                            className="text-[11px] text-blue-400 font-mono hover:text-blue-600 hover:underline cursor-pointer text-left mt-0.5">
                            /#{modAnchor}
                          </button>
                        </div>
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 font-medium hidden sm:inline">{WIDTH_OPTIONS.find(w => w.value === mod.width)?.label}</span>
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 font-medium hidden sm:inline">{MODULE_TYPES.find(t => t.value === mod.type)?.label}</span>
                        <button onClick={() => { const updated = homeModules.map(m => m.id === mod.id ? { ...m, visible: !m.visible } : m); setHomeModules(updated); saveHomeModules(updated) }}
                          className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${mod.visible ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                          {mod.visible ? '显示' : '隐藏'}
                        </button>
                        <button onClick={() => setEditingModuleId(mod.id)}
                          className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium">
                          编辑
                        </button>
                        <button onClick={() => removeModule(mod.id)} className="text-xs px-3 py-1 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors font-medium">删除</button>
                      </div>
                    </div>
                  )})}
                </div>
                {homeModules.length === 0 && (
                  <div className="py-8 text-center">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center"><Layout size={24} className="text-gray-300" /></div>
                    <p className="text-sm text-gray-500">暂无模块</p>
                    <p className="text-[10px] text-gray-400 mt-1">点击"添加模块"选择模块类型开始搭建首页</p>
                  </div>
                )}
                </div>
              </div>

              {/* Module Type Picker Modal */}
              {showModuleTypePicker && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModuleTypePicker(false)}>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl mx-4 border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                    <div className="px-5 py-4 border-b flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-t-2xl">
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">选择模块类型</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">选择要添加的模块类型，创建后可进一步配置</p>
                      </div>
                      <button onClick={() => setShowModuleTypePicker(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"><X size={16} /></button>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Newspaper size={12} />文章展示模块</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {MODULE_TYPES.filter(t => t.group === 'article').map(t => (
                            <button key={t.value} onClick={() => addModule(t.value)}
                              className="p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all text-left group">
                              <div className="text-lg mb-1">{t.icon}</div>
                              <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600">{t.label}</div>
                              <div className="text-[9px] text-gray-400 mt-0.5 leading-tight">{t.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Layout size={12} />展示组件</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {MODULE_TYPES.filter(t => t.group === 'display').map(t => (
                            <button key={t.value} onClick={() => addModule(t.value)}
                              className="p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all text-left group">
                              <div className="text-lg mb-1">{t.icon}</div>
                              <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600">{t.label}</div>
                              <div className="text-[9px] text-gray-400 mt-0.5 leading-tight">{t.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Code2 size={12} />自定义</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {MODULE_TYPES.filter(t => t.group === 'custom').map(t => (
                            <button key={t.value} onClick={() => addModule(t.value)}
                              className="p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all text-left group">
                              <div className="text-lg mb-1">{t.icon}</div>
                              <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600">{t.label}</div>
                              <div className="text-[9px] text-gray-400 mt-0.5 leading-tight">{t.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Module Edit Modal */}
              {editingModuleId && (() => {
                const mod = homeModules.find(m => m.id === editingModuleId)
                if (!mod) return null
                const typeMeta = MODULE_TYPES.find(t => t.value === mod.type)
                const isArticle = ['category_list', 'news_feed', 'latest_covers'].includes(mod.type)
                return (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingModuleId(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                      <div className="px-5 py-4 border-b flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-t-2xl">
                        <div>
                          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">编辑模块 · {typeMeta?.label || mod.type}</h3>
                          <p className="text-[10px] text-gray-400 mt-0.5">{typeMeta?.desc}</p>
                        </div>
                        <button onClick={() => setEditingModuleId(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"><X size={16} /></button>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">标题（留空用默认）</label>
                            <input type="text" value={mod.title} onChange={e => updateModule(mod.id, { title: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-xs dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" placeholder="自动使用类型名" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">宽度</label>
                            <select value={mod.width} onChange={e => updateModule(mod.id, { width: e.target.value as HomeModule['width'] })}
                              className="w-full px-3 py-2 border rounded-lg text-xs dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none">
                              {WIDTH_OPTIONS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-1">锚点标识（用于导航链接）</label>
                          <input type="text" value={(mod.config?.slug as string) || ''} onChange={e => updateModule(mod.id, { config: { ...mod.config, slug: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') } })}
                            className="w-full px-3 py-2 border rounded-lg text-xs dark:bg-gray-700 dark:border-gray-600 font-mono focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" placeholder={mod.id} />
                        </div>
                        {mod.type === 'category_list' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-1">展示分类 <span className="text-red-400">*</span></label>
                                <select value={mod.category || ''} onChange={e => updateModule(mod.id, { category: e.target.value })}
                                  className={`w-full px-3 py-2 border rounded-lg text-xs dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none ${!mod.category ? 'border-red-300 bg-red-50/50' : ''}`}>
                                  <option value="">— 请选择分类 —</option>
                                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                                </select>
                                {!mod.category && <p className="text-[10px] text-red-400 mt-1">必须选择一个分类，模块才会显示内容</p>}
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-1">Tab联动分类（可选）</label>
                                <select value={(mod.config?.tabWith as string) || ''} onChange={e => updateModule(mod.id, { config: { ...mod.config, tabWith: e.target.value } })}
                                  className="w-full px-3 py-2 border rounded-lg text-xs dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none">
                                  <option value="">不使用</option>
                                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                                </select>
                              </div>
                            </div>
                            <div className="border border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-3">
                              <p className="text-[10px] text-gray-400 mb-2">没有想要的分类？直接新建：</p>
                              <div className="flex gap-2">
                                <input type="text" id="newCatName" placeholder="分类名称（如：政策法规）"
                                  className="flex-1 px-3 py-1.5 border rounded-lg text-xs dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" />
                                <button type="button" onClick={async () => {
                                  const nameInput = document.getElementById('newCatName') as HTMLInputElement
                                  const name = nameInput?.value?.trim()
                                  if (!name) { showMsg('请输入分类名称', 'error'); return }
                                  const slug = `cat_${Date.now().toString(36)}`
                                  const token = getToken()
                                  if (!token) return
                                  try {
                                    const res = await fetch('/api/categories', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                      body: JSON.stringify({ name, slug }),
                                    })
                                    if (res.ok) {
                                      const cat = await res.json()
                                      setCategories(prev => [...prev, cat])
                                      updateModule(mod.id, { category: cat.slug })
                                      nameInput.value = ''
                                      showMsg(`分类「${name}」创建成功，已自动选中`)
                                    } else {
                                      const data = await res.json()
                                      showMsg(data.error || '创建失败', 'error')
                                    }
                                  } catch { showMsg('创建失败', 'error') }
                                }}
                                  className="px-4 py-1.5 text-xs font-medium bg-bank-primary text-white rounded-lg hover:bg-bank-dark transition-colors whitespace-nowrap">
                                  新建分类
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        {isArticle && (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-1">显示条数</label>
                                <input type="number" min={1} max={20} value={(mod.config?.limit as number) || 8}
                                  onChange={e => updateModule(mod.id, { config: { ...mod.config, limit: parseInt(e.target.value) || 8 } })}
                                  className="w-full px-3 py-2 border rounded-lg text-xs dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-1">布局样式</label>
                                <select value={(mod.config?.layout as string) || 'default'} onChange={e => updateModule(mod.id, { config: { ...mod.config, layout: e.target.value } })}
                                  className="w-full px-3 py-2 border rounded-lg text-xs dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none">
                                  {LAYOUT_TEMPLATES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-1.5">布局预览</label>
                              <div className="grid grid-cols-4 gap-2">
                                {LAYOUT_TEMPLATES.map(l => (
                                  <button key={l.value} type="button" onClick={() => updateModule(mod.id, { config: { ...mod.config, layout: l.value } })}
                                    className={`p-2.5 rounded-lg border text-center transition-all ${
                                      (mod.config?.layout || 'default') === l.value
                                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-200'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                    }`}>
                                    <div className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{l.label}</div>
                                    <div className="text-[9px] text-gray-400 mt-0.5">{l.desc}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                        {mod.type === 'custom' && (
                          <>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-1">链接地址（可选）</label>
                                <input type="text" value={(mod.config?.linkUrl as string) || ''} onChange={e => updateModule(mod.id, { config: { ...mod.config, linkUrl: e.target.value } })}
                                  className="w-full px-3 py-2 border rounded-lg text-xs dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" placeholder="/category/notice 或 https://..." />
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-1">链接文字</label>
                                <input type="text" value={(mod.config?.linkText as string) || ''} onChange={e => updateModule(mod.id, { config: { ...mod.config, linkText: e.target.value } })}
                                  className="w-full px-3 py-2 border rounded-lg text-xs dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" placeholder="查看更多" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-500 mb-1">背景颜色</label>
                                <input type="text" value={(mod.config?.bgColor as string) || ''} onChange={e => updateModule(mod.id, { config: { ...mod.config, bgColor: e.target.value } })}
                                  className="w-full px-3 py-2 border rounded-lg text-xs dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" placeholder="#ffffff 或 transparent" />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] text-gray-500">自定义 HTML 内容</label>
                                <button type="button" disabled={aiHtmlGenerating} onClick={async () => {
                                  setAiHtmlGenerating(true)
                                  const moduleTitle = mod.title || '自定义模块'
                                  const result = await aiChat(
                                    [{ role: 'user', content: `为门户网站的"${moduleTitle}"模块生成一段自定义HTML内容。要求：1.视觉美观，使用内联CSS样式 2.响应式设计 3.包含标题、描述和装饰元素 4.主题色${currentThemeHex} 5.只返回HTML代码，不要markdown` }],
                                    '你是HTML生成器，只返回纯HTML代码，不要任何前缀说明或markdown代码块标记。'
                                  )
                                  if (result) {
                                    let html = result.trim()
                                    if (html.startsWith('```')) html = html.replace(/^```(?:html)?\s*/, '').replace(/\s*```$/, '')
                                    updateModule(mod.id, { config: { ...mod.config, htmlContent: html } })
                                  }
                                  setAiHtmlGenerating(false)
                                }}
                                  className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center gap-1 disabled:opacity-40 transition-colors">
                                  <Sparkles size={10} />{aiHtmlGenerating ? '生成中...' : 'AI生成HTML'}
                                </button>
                              </div>
                              <textarea value={(mod.config?.htmlContent as string) || ''} onChange={e => updateModule(mod.id, { config: { ...mod.config, htmlContent: e.target.value } })}
                                className="w-full px-3 py-2 border rounded-lg text-xs font-mono dark:bg-gray-700 dark:border-gray-600 resize-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" rows={6}
                                placeholder="<div class='p-4'>&#10;  <h3>自定义标题</h3>&#10;  <p>自定义内容...</p>&#10;</div>" />
                              <p className="text-[9px] text-gray-400 mt-1">支持 HTML + Tailwind CSS 类名，内容将直接渲染在首页模块中</p>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="px-5 py-3.5 border-t bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl flex justify-end gap-2">
                        <button onClick={() => setEditingModuleId(null)} className="text-xs px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors">取消</button>
                        <button onClick={() => { saveHomeModules(homeModules); setEditingModuleId(null) }}
                          className="text-xs px-4 py-2 rounded-lg bg-bank-primary text-white hover:bg-bank-dark shadow-sm hover:shadow transition-all font-medium">保存</button>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Floating Sidebar Config */}
              <div className="border dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-900">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">悬浮侧栏配置</h3>
                <p className="text-[10px] text-gray-400 mb-4">配置页面左右两侧悬浮按钮的分类、名称和图标</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { side: 'left', label: '左侧悬浮按钮', catKey: 'sidebar_left_category', nameKey: 'sidebar_left_name', iconKey: 'sidebar_left_icon', color: 'red' },
                    { side: 'right', label: '右侧悬浮按钮', catKey: 'sidebar_right_category', nameKey: 'sidebar_right_name', iconKey: 'sidebar_right_icon', color: 'amber' },
                  ].map(item => (
                    <div key={item.side} className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 border-b pb-1">{item.label}</h4>
                      <div>
                        <label className="text-[10px] text-gray-500 mb-1 block">关联分类</label>
                        <div className="flex gap-2">
                          <select value={siteSettings[item.catKey] || ''}
                            onChange={e => setSiteSettings(prev => ({ ...prev, [item.catKey]: e.target.value }))}
                            className="flex-1 px-2 py-1.5 border rounded text-xs focus:outline-none focus:border-bank-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                            <option value="">— 不显示 —</option>
                            {categories.map(c => <option key={c.id} value={c.slug}>{c.name}（{c.slug}）</option>)}
                          </select>
                          <button onClick={() => saveSiteSetting(item.catKey, siteSettings[item.catKey] || '', `${item.label}分类`)}
                            className="bg-bank-primary text-white text-[10px] px-2.5 py-1.5 rounded hover:bg-bank-dark transition-colors">保存</button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 mb-1 block">显示名称（留空使用分类名）</label>
                        <div className="flex gap-2">
                          <input type="text" value={siteSettings[item.nameKey] || ''}
                            onChange={e => setSiteSettings(prev => ({ ...prev, [item.nameKey]: e.target.value }))}
                            placeholder="如：互动反馈"
                            className="flex-1 px-2 py-1.5 border rounded text-xs focus:outline-none focus:border-bank-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                          <button onClick={() => saveSiteSetting(item.nameKey, siteSettings[item.nameKey] || '', `${item.label}名称`)}
                            className="bg-bank-primary text-white text-[10px] px-2.5 py-1.5 rounded hover:bg-bank-dark transition-colors">保存</button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 mb-1 block">图标图片（建议 80×80 PNG）</label>
                        <div className="flex items-center gap-3">
                          {siteSettings[item.iconKey] && (
                            <div className="relative">
                              <img src={siteSettings[item.iconKey]} alt="icon" className="w-10 h-10 rounded border object-cover" />
                              <button onClick={() => { setSiteSettings(prev => ({ ...prev, [item.iconKey]: '' })); saveSiteSetting(item.iconKey, '', `${item.label}图标`) }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center hover:bg-red-600">✕</button>
                            </div>
                          )}
                          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] px-3 py-1.5 rounded transition-colors flex items-center gap-1">
                            <Upload size={11} />上传图标
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0]; if (!file) return
                              const formData = new FormData(); formData.append('file', file)
                              const token = localStorage.getItem('token')
                              try {
                                const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData })
                                if (res.ok) {
                                  const data = await res.json()
                                  setSiteSettings(prev => ({ ...prev, [item.iconKey]: data.url }))
                                  saveSiteSetting(item.iconKey, data.url, `${item.label}图标`)
                                  showMsg('图标上传成功')
                                } else showMsg('上传失败', 'error')
                              } catch { showMsg('上传失败', 'error') }
                            }} />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popup Image */}
              <div className="border dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-900">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">悬浮按钮弹窗图片</h3>
                <p className="text-[10px] text-gray-400 mb-4">用户点击左侧悬浮按钮后弹出显示的图片（留空则跳转对应分类页）</p>
                {popupImage && (
                  <div className="mb-3 relative inline-block">
                    <img src={popupImage} alt="弹窗图片" className="max-w-sm max-h-60 rounded-lg border shadow-sm" />
                    <button onClick={() => { setPopupImage(''); savePopupImage('') }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600">✕</button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer bg-bank-primary text-white text-xs px-4 py-2 rounded-lg hover:bg-bank-dark transition-all shadow-sm hover:shadow flex items-center gap-1.5">
                    <Upload size={13} />
                    {uploading ? '上传中...' : '上传图片'}
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return
                      setUploading(true)
                      const formData = new FormData(); formData.append('file', file)
                      const token = localStorage.getItem('token')
                      try {
                        const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData })
                        if (res.ok) { const data = await res.json(); setPopupImage(data.url); savePopupImage(data.url); showMsg('图片上传成功') }
                        else showMsg('上传失败', 'error')
                      } catch { showMsg('上传失败', 'error') }
                      setUploading(false)
                    }} />
                  </label>
                  <span className="text-[10px] text-gray-400">支持 JPG、PNG 格式，建议宽度 800px 以上</span>
                </div>
              </div>

              {/* Sensitive Words Config */}
              <div className="border dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-900">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">评论敏感词过滤</h3>
                <p className="text-[10px] text-gray-400 mb-4">包含敏感词的评论将被自动拦截，用逗号分隔多个词语</p>
                <textarea
                  value={siteSettings.sensitive_words || ''}
                  onChange={e => setSiteSettings(prev => ({ ...prev, sensitive_words: e.target.value }))}
                  className="w-full px-3 py-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-bank-red/20 focus:border-bank-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 resize-none font-mono leading-relaxed"
                  rows={4}
                  placeholder="妈的,傻逼,操你,fuck,shit..."
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-gray-400">
                    当前已配置 <strong>{(siteSettings.sensitive_words || '').split(/[,，\n]/).filter(Boolean).length}</strong> 个敏感词
                  </span>
                  <button
                    onClick={() => saveSiteSetting('sensitive_words', siteSettings.sensitive_words || '', '评论敏感词（逗号分隔）')}
                    className="bg-bank-primary text-white text-xs px-4 py-2 rounded-lg hover:bg-bank-dark transition-all shadow-sm hover:shadow font-medium"
                  >保存敏感词</button>
                </div>
              </div>

              {/* AI Model Configuration */}
              <div className="border dark:border-gray-700 rounded-xl bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-gray-900 overflow-hidden">
                <div className={`flex items-center justify-between px-5 py-3.5 ${aiConfigLoaded ? 'cursor-pointer hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors' : ''}`}
                  onClick={() => aiConfigLoaded && setAiConfigCollapsed(prev => !prev)}>
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-500" />
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">AI 智能助手配置</h3>
                    {aiConfigLoaded && aiConfigCollapsed && aiConfig.apiKey && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400 font-medium">
                        ✓ {AI_PROVIDERS.find(p => p.value === aiConfig.provider)?.label || aiConfig.provider} / {aiConfig.model}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!aiConfigLoaded && (
                      <button onClick={(e) => { e.stopPropagation(); loadAiConfig() }} className="text-[10px] text-purple-500 hover:text-purple-700 underline">加载配置</button>
                    )}
                    {aiConfigLoaded && (
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${aiConfigCollapsed ? '' : 'rotate-180'}`} />
                    )}
                  </div>
                </div>

                <div className={`${aiConfigCollapsed ? 'hidden' : ''} px-5 pb-5`}>
                <p className="text-[10px] text-gray-400 mb-4">配置AI大模型，启用一键布局、智能写作等功能。支持市面主流大模型。</p>

                {!aiConfigLoaded ? (
                  <button onClick={() => loadAiConfig()}
                    className="w-full py-8 border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-xl text-center hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors">
                    <Sparkles size={24} className="text-purple-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">点击加载 AI 配置</p>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">AI 服务商</label>
                        <select value={aiConfig.provider}
                          onChange={e => {
                            const p = AI_PROVIDERS.find(x => x.value === e.target.value)
                            setAiConfig(prev => ({
                              ...prev,
                              provider: e.target.value,
                              apiBase: p?.defaultBase || '',
                              model: p?.models[0] || prev.model,
                            }))
                          }}
                          className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                          {AI_PROVIDERS.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">模型</label>
                        {(() => {
                          const provider = AI_PROVIDERS.find(p => p.value === aiConfig.provider)
                          const models = provider?.models || []
                          return models.length > 0 ? (
                            <select value={aiConfig.model}
                              onChange={e => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
                              className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                              {models.map(m => <option key={m} value={m}>{m}</option>)}
                              {!models.includes(aiConfig.model) && <option value={aiConfig.model}>{aiConfig.model} (自定义)</option>}
                            </select>
                          ) : (
                            <input type="text" value={aiConfig.model}
                              onChange={e => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
                              className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 font-mono"
                              placeholder="输入模型名称" />
                          )
                        })()}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">API Key</label>
                      <input type="password" value={aiConfig.apiKey}
                        onChange={e => setAiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        placeholder="sk-..." />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">API 地址（留空使用默认）</label>
                      <input type="text" value={aiConfig.apiBase}
                        onChange={e => setAiConfig(prev => ({ ...prev, apiBase: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        placeholder={AI_PROVIDERS.find(p => p.value === aiConfig.provider)?.defaultBase || 'https://api.example.com/v1'} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Temperature（创造力 0-2）</label>
                        <div className="flex items-center gap-2">
                          <input type="range" min={0} max={2} step={0.1} value={aiConfig.temperature}
                            onChange={e => setAiConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                            className="flex-1 accent-purple-500" />
                          <span className="text-xs text-gray-500 w-8 text-right font-mono">{aiConfig.temperature}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">最大 Tokens</label>
                        <input type="number" min={256} max={32768} step={256} value={aiConfig.maxTokens}
                          onChange={e => setAiConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 2048 }))}
                          className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                      </div>
                    </div>

                    {aiTestResult && (
                      <div className={`text-xs px-3 py-2 rounded-lg ${aiTestResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {aiTestResult.ok ? '✓' : '✕'} {aiTestResult.msg}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={saveAiConfig}
                        className="bg-purple-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-medium flex items-center gap-1.5">
                        <Sparkles size={12} />保存配置
                      </button>
                      <button onClick={testAiConnection} disabled={aiTesting || !aiConfig.apiKey}
                        className="bg-white border border-purple-200 text-purple-600 text-xs px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors font-medium disabled:opacity-50 flex items-center gap-1.5">
                        <Zap size={12} />{aiTesting ? '测试中...' : '测试连接'}
                      </button>
                    </div>

                  </div>
                )}
                </div>

                {/* AI Capabilities — always visible when loaded */}
                {aiConfigLoaded && aiConfig.apiKey && (
                  <div className="px-5 pb-5">
                    <div className="border-t pt-4 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5"><Bot size={13} />AI 功能</h4>
                        {aiConfigCollapsed && (
                          <button onClick={() => setAiConfigCollapsed(false)} className="text-[10px] text-purple-500 hover:text-purple-700 underline">修改配置</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={openAiDesigner} disabled={!aiConfig.apiKey}
                          className="p-3 rounded-xl border border-purple-100 dark:border-purple-900 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all text-left group disabled:opacity-50">
                          <div className="text-lg mb-1">🎨</div>
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 group-hover:text-purple-600">AI 布局设计器</div>
                          <div className="text-[9px] text-gray-400 mt-0.5">专属设计器：对话+实时预览+拖拽排序</div>
                        </button>
                        <button onClick={async () => { if (!aiChatLoaded) { const h = await loadAiChatHistory('chat'); if (h.messages.length > 0) setAiChatMessages(h.messages); setAiChatLoaded(true) } setShowAiPanel(true) }} disabled={!aiConfig.apiKey}
                          className="p-3 rounded-xl border border-purple-100 dark:border-purple-900 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all text-left group disabled:opacity-50">
                          <div className="text-lg mb-1">💬</div>
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 group-hover:text-purple-600">AI 对话</div>
                          <div className="text-[9px] text-gray-400 mt-0.5">生成HTML、设计首页样式、写文章等</div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Layout Designer — Full Dialog */}
        {showAiDesigner && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl mx-4 h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Header */}
              <div className="px-5 py-3 border-b flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-2xl shrink-0">
                <div className="flex items-center gap-2">
                  <Layout size={16} />
                  <span className="text-sm font-bold">AI 布局设计器</span>
                  <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded">{designerModules.length} 个模块</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setDesignerModules([...homeModules]); showMsg('已重置为当前首页布局') }}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1">
                    <RotateCcw size={10} />重置
                  </button>
                  <button onClick={() => setShowAiDesigner(false)} className="p-1 rounded-lg hover:bg-white/20 transition-colors"><X size={16} /></button>
                </div>
              </div>

              {/* Body: Left Chat + Right Preview */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left: Chat */}
                <div className="w-[45%] border-r dark:border-gray-700 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    {designerMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-bl-sm'
                        }`}>
                          {msg.role === 'user' ? (
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          ) : (
                            <div className="prose prose-xs dark:prose-invert max-w-none [&_pre]:bg-gray-800 [&_pre]:text-gray-100 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-[11px] [&_pre]:overflow-x-auto [&_code]:text-[11px] [&_code]:bg-gray-200 [&_code]:dark:bg-gray-600 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {designerGenerating && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-xl rounded-bl-sm">
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={designerChatEndRef} />
                  </div>
                  {/* Quick prompts */}
                  <div className="px-3 py-2 border-t dark:border-gray-700 flex flex-wrap gap-1">
                    {[
                      { label: '生成新方案', prompt: '请根据当前分类，为我生成一套全新的首页布局方案。' },
                      { label: '更简洁', prompt: '当前模块太多了，帮我精简到6-8个核心模块。' },
                      { label: '更丰富', prompt: '帮我增加几个模块，让首页内容更丰富。' },
                      { label: '调整宽度', prompt: '帮我优化各模块的宽度搭配，让布局更美观。' },
                    ].map((item, i) => (
                      <button key={i} onClick={() => setDesignerInput(item.prompt)}
                        className="text-[9px] px-2 py-1 rounded-full bg-purple-50 text-purple-500 hover:bg-purple-100 transition-colors dark:bg-purple-900/30 dark:text-purple-300">
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {/* Input */}
                  <div className="p-3 border-t dark:border-gray-700">
                    <form onSubmit={e => { e.preventDefault(); designerSend() }} className="flex gap-2">
                      <input type="text" value={designerInput} onChange={e => setDesignerInput(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        placeholder="描述你想要的首页布局..." disabled={designerGenerating} />
                      <button type="submit" disabled={designerGenerating || !designerInput.trim()}
                        className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">
                        <Send size={14} />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right: Drag-Drop Module Preview */}
                <div className="w-[55%] flex flex-col bg-gray-50 dark:bg-gray-900/50">
                  <div className="px-4 py-2.5 border-b dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                      <GripVertical size={12} />模块预览 · 拖拽排序
                    </span>
                    <span className="text-[9px] text-gray-400">{designerModules.length} 个模块</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {designerModules.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Layout size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-xs">暂无模块</p>
                        <p className="text-[10px] mt-1">在左侧对话中让 AI 生成布局方案</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-12 gap-2">
                        {designerModules.map((mod, i) => {
                          const widthCls = mod.width === 'full' ? 'col-span-12' : mod.width === 'two-thirds' ? 'col-span-8' : mod.width === 'half' ? 'col-span-6' : 'col-span-4'
                          const typeLabel = MODULE_TYPES.find(t => t.value === mod.type)?.label || mod.type
                          const typeIcon = MODULE_TYPES.find(t => t.value === mod.type)?.icon || '📦'
                          return (
                            <div
                              key={mod.id || i}
                              draggable
                              onDragStart={() => setDesignerDragIdx(i)}
                              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-purple-400') }}
                              onDragLeave={e => { e.currentTarget.classList.remove('ring-2', 'ring-purple-400') }}
                              onDrop={e => {
                                e.currentTarget.classList.remove('ring-2', 'ring-purple-400')
                                if (designerDragIdx === null || designerDragIdx === i) return
                                const arr = [...designerModules]
                                const [moved] = arr.splice(designerDragIdx, 1)
                                arr.splice(i, 0, moved)
                                setDesignerModules(arr.map((m, idx) => ({ ...m, sort: idx })))
                                setDesignerDragIdx(null)
                              }}
                              onDragEnd={() => setDesignerDragIdx(null)}
                              className={`${widthCls} border rounded-lg p-2.5 cursor-grab active:cursor-grabbing transition-all ${
                                designerDragIdx === i ? 'opacity-40 scale-95 border-purple-300' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-sm">{typeIcon}</span>
                                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 truncate">{mod.title || '未命名'}</span>
                                </div>
                                <button onClick={e => { e.stopPropagation(); setDesignerModules(prev => prev.filter((_, idx) => idx !== i)) }}
                                  className="p-0.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0" title="删除"><X size={11} /></button>
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                                <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-500 dark:bg-purple-900/40 dark:text-purple-300">{typeLabel}</span>
                                <select value={mod.width} onClick={e => e.stopPropagation()}
                                  onChange={e => { setDesignerModules(prev => prev.map((m, idx) => idx === i ? { ...m, width: e.target.value as HomeModule['width'] } : m)) }}
                                  className="bg-transparent border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 text-[9px] outline-none cursor-pointer">
                                  {WIDTH_OPTIONS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                                </select>
                                {mod.category && <span>📂{mod.category}</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 shrink-0 rounded-b-2xl">
                <p className="text-[10px] text-gray-400">在左侧与 AI 对话设计布局，右侧实时拖拽调整，满意后点击应用</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowAiDesigner(false)} className="px-4 py-2 text-xs border rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors">取消</button>
                  <button onClick={designerApply} disabled={designerModules.length === 0}
                    className="px-5 py-2 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-1.5 shadow-sm disabled:opacity-50">
                    <Sparkles size={12} />应用到首页
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating AI Chat Panel */}
        {showAiPanel && (
          <div className="fixed bottom-4 right-4 w-[420px] h-[560px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden">
            <div className="px-4 py-3 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Bot size={16} />
                <span className="text-sm font-bold">AI 智能助手</span>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded">{aiConfig.provider}/{aiConfig.model}</span>
              </div>
              <div className="flex items-center gap-1">
                {aiChatMessages.length > 0 && (
                  <button onClick={() => setAiChatMessages([])} className="p-1 rounded-lg hover:bg-white/20 transition-colors" title="清空对话"><RotateCcw size={12} /></button>
                )}
                <button onClick={() => setShowAiPanel(false)} className="p-1 rounded-lg hover:bg-white/20 transition-colors"><X size={14} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {aiChatMessages.length === 0 && (
                <div className="text-center py-4">
                  <Bot size={28} className="text-purple-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 mb-3">我是门户网站AI助手，可以帮你：</p>
                  <div className="grid grid-cols-2 gap-1.5 text-left">
                    {[
                      { icon: '🖼️', text: `生成一个首页欢迎Banner HTML，主题色${currentThemeHex}` },
                      { icon: '🧭', text: '生成快捷导航HTML模块，6个常用入口' },
                      { icon: '📢', text: '生成一个滚动公告栏HTML模块' },
                      { icon: '📊', text: '生成一个数据统计展示面板HTML' },
                      { icon: '📝', text: '帮我写一篇关于春节放假的通知' },
                      { icon: '🎨', text: '首页设计优化建议' },
                    ].map((q, i) => (
                      <button key={i} onClick={() => { setAiChatInput(q.text) }}
                        className="text-[11px] px-2.5 py-2 rounded-lg border border-gray-100 dark:border-gray-700 text-gray-500 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition-colors flex items-center gap-1.5">
                        <span>{q.icon}</span><span className="truncate">{q.text}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t dark:border-gray-700">
                    <p className="text-[10px] text-gray-400 mb-2">💡 你可以让 AI 生成 HTML 内容，然后一键添加到首页</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {[
                        { label: '生成Banner', prompt: `请生成一段美观的首页Banner HTML代码，主题是网站欢迎横幅，要求：使用内联CSS，主题色${currentThemeHex}，响应式设计，宽度100%。只返回HTML代码。` },
                        { label: '生成导航面板', prompt: `生成一段快捷导航HTML模块，包含6-8个常用链接入口（图标+文字），使用内联CSS和flexbox布局，主题色${currentThemeHex}。只返回HTML代码。` },
                        { label: '生成公告栏', prompt: `生成一个美观的公告栏HTML模块，包含3-5条示例公告，有日期和标题，使用内联CSS，主题色${currentThemeHex}。只返回HTML代码。` },
                        { label: '生成轮播图', prompt: `生成一个纯CSS轮播图HTML模块，包含3张示例幻灯片（使用渐变色代替图片），使用内联CSS和CSS animation，主题色${currentThemeHex}。只返回HTML代码。` },
                        { label: '写通知公告', prompt: '请帮我写一篇正式的通知公告，主题是：' },
                        { label: '写活动方案', prompt: '请帮我写一份详细的活动策划方案，活动主题是：' },
                      ].map((item, i) => (
                        <button key={i} onClick={() => { setAiChatInput(item.prompt); }}
                          className="text-[10px] px-2 py-1 rounded-full bg-purple-50 text-purple-500 hover:bg-purple-100 hover:text-purple-700 transition-colors dark:bg-purple-900/30 dark:text-purple-300">
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {aiChatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`relative max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-bl-sm'
                  }`}>
                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <div className="prose prose-xs dark:prose-invert max-w-none [&_pre]:bg-gray-800 [&_pre]:text-gray-100 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-[11px] [&_pre]:overflow-x-auto [&_code]:text-[11px] [&_code]:bg-gray-200 [&_code]:dark:bg-gray-600 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_h4]:text-xs [&_blockquote]:border-purple-300 [&_blockquote]:text-gray-500 [&_a]:text-purple-500">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                    {msg.role === 'assistant' && (
                      <div className="flex flex-wrap items-center gap-1 mt-1.5 pt-1.5 border-t border-gray-200/50 dark:border-gray-600/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { navigator.clipboard.writeText(msg.content); showMsg('已复制到剪贴板') }}
                          className="text-[9px] text-gray-400 hover:text-purple-500 flex items-center gap-0.5 transition-colors">
                          <Copy size={9} />复制
                        </button>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <button onClick={() => { setAiChatInput('请继续') }}
                          className="text-[9px] text-gray-400 hover:text-purple-500 transition-colors">继续</button>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <button onClick={() => { setAiChatInput('请用更简洁的方式重写') }}
                          className="text-[9px] text-gray-400 hover:text-purple-500 transition-colors">精简</button>
                        {extractLayoutJson(msg.content) && (<>
                          <span className="text-gray-300 dark:text-gray-600">|</span>
                          <button onClick={() => {
                            const mods = extractLayoutJson(msg.content)
                            if (mods) {
                              setDesignerModules(mods)
                              setDesignerMessages([{ role: 'assistant', content: '已加载布局方案到设计器，你可以在右侧拖拽调整。' }])
                              setDesignerInput('')
                              setShowAiDesigner(true)
                            }
                          }}
                            className="text-[9px] text-green-600 hover:text-green-700 font-medium flex items-center gap-0.5 transition-colors">
                            <Layout size={9} />在设计器中编辑
                          </button>
                        </>)}
                        {(msg.content.includes('<div') || msg.content.includes('<section') || msg.content.includes('<style') || msg.content.includes('```html')) && !extractLayoutJson(msg.content) && (<>
                          <span className="text-gray-300 dark:text-gray-600">|</span>
                          <button onClick={() => {
                            let html = ''
                            // Extract HTML from ```html code blocks
                            const htmlBlockMatch = msg.content.match(/```html\s*\n([\s\S]*?)```/)
                            if (htmlBlockMatch) {
                              html = htmlBlockMatch[1].trim()
                            } else {
                              // Fallback: try generic code block
                              const codeBlockMatch = msg.content.match(/```\s*\n([\s\S]*?)```/)
                              if (codeBlockMatch) {
                                html = codeBlockMatch[1].trim()
                              } else {
                                // Last resort: strip non-HTML text before first tag
                                html = msg.content.trim()
                                const tagStart = html.search(/<(!DOCTYPE|html|div|section|style|head)/i)
                                if (tagStart > 0) html = html.substring(tagStart)
                              }
                            }
                            if (!html) { showMsg('未找到有效的HTML内容', 'error'); return }
                            const newMod: HomeModule = {
                              id: `ai_${Date.now()}`,
                              type: 'custom',
                              title: 'AI 生成模块',
                              width: 'full',
                              sort: homeModules.length,
                              visible: true,
                              config: { htmlContent: html },
                            }
                            const updated = [...homeModules, newMod]
                            setHomeModules(updated)
                            saveHomeModules(updated)
                            showMsg('已添加为首页自定义模块，可在模块配置中编辑')
                          }}
                            className="text-[9px] text-purple-500 hover:text-purple-700 font-medium flex items-center gap-0.5 transition-colors">
                            <Plus size={9} />添加到首页
                          </button>
                        </>)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {aiChatGenerating && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-xl rounded-bl-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={aiChatEndRef} />
            </div>
            <div className="p-3 border-t dark:border-gray-700">
              <form onSubmit={e => { e.preventDefault(); aiSendChat() }} className="flex gap-2">
                <input type="text" value={aiChatInput} onChange={e => setAiChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  placeholder="输入问题，或选择上方快捷操作..." disabled={aiChatGenerating} />
                <button type="submit" disabled={aiChatGenerating || !aiChatInput.trim()}
                  className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b dark:bg-gray-800 dark:border-gray-700">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-500">ID</th>
                  <th className="text-left p-3 font-medium text-gray-500">用户名</th>
                  <th className="text-left p-3 font-medium text-gray-500">姓名</th>
                  <th className="text-left p-3 font-medium text-gray-500">邮箱</th>
                  <th className="text-center p-3 font-medium text-gray-500">角色</th>
                  {isSuperAdmin && <th className="text-left p-3 font-medium text-gray-500">模块权限</th>}
                  <th className="text-center p-3 font-medium text-gray-500">文章</th>
                  <th className="text-center p-3 font-medium text-gray-500">评论</th>
                  <th className="text-left p-3 font-medium text-gray-500">注册时间</th>
                  <th className="text-center p-3 font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {users.map(u => {
                  const simpleModules = [
                    { key: 'users', label: '用户' },
                    { key: 'menus', label: '导航' },
                    { key: 'settings', label: '设置' },
                  ]
                  const catModules = [
                    { key: 'publish', label: '发文' },
                    { key: 'posts', label: '文章' },
                    { key: 'comments', label: '评论' },
                  ]
                  const hasMod = (mod: string) => u.role === 'SUPER_ADMIN' || u.permissions.includes(mod) || u.permissions.some(p => p.startsWith(mod + ':'))
                  const disabled = u.role === 'SUPER_ADMIN' || u.id === user?.id
                  return (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3 text-gray-400">{u.id}</td>
                    <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{u.username}</td>
                    <td className="p-3 text-gray-500">{u.realName || '-'}</td>
                    <td className="p-3 text-gray-500">{u.email || '-'}</td>
                    <td className="p-3 text-center">
                      {isSuperAdmin && u.id !== user?.id ? (
                        <select value={u.role}
                          onChange={e => {
                            const r = e.target.value
                            const allBase = [...catModules, ...simpleModules].map(m => m.key)
                            handleSaveUserRole(u.id, r, r === 'SUPER_ADMIN' ? allBase : r === 'USER' ? [] : u.permissions)
                          }}
                          className="text-[10px] px-1.5 py-0.5 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                          <option value="USER">普通用户</option>
                          <option value="ADMIN">管理员</option>
                          <option value="SUPER_ADMIN">超级管理员</option>
                        </select>
                      ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.role === 'SUPER_ADMIN' ? '超管' : u.role === 'ADMIN' ? '管理员' : '用户'}
                        </span>
                      )}
                    </td>
                    {isSuperAdmin && (
                      <td className="p-3">
                        {(u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') ? (
                          <div className="flex flex-wrap gap-1">
                            {catModules.map(m => {
                              const has = hasMod(m.key)
                              const catPerms = u.permissions.filter(p => p.startsWith(m.key + ':'))
                              const catCount = catPerms.length
                              return (
                                <button key={m.key} disabled={disabled}
                                  onClick={() => { if (!disabled) { setPermEditUser(u); setPermEditPerms([...u.permissions]) } }}
                                  className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                                    has ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-400 border-gray-200'
                                  } ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}>
                                  {m.label}{has && !u.permissions.includes(m.key) && catCount > 0 ? `(${catCount})` : ''}
                                </button>
                              )
                            })}
                            {simpleModules.map(m => {
                              const has = hasMod(m.key)
                              return (
                                <button key={m.key} disabled={disabled}
                                  onClick={() => {
                                    const newPerms = has ? u.permissions.filter(p => p !== m.key) : [...u.permissions, m.key]
                                    handleSaveUserRole(u.id, u.role, newPerms, true)
                                  }}
                                  className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                                    has ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-400 border-gray-200'
                                  } ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}>
                                  {m.label}
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300">—</span>
                        )}
                      </td>
                    )}
                    <td className="p-3 text-center text-gray-400">{u._count.posts}</td>
                    <td className="p-3 text-center text-gray-400">{u._count.comments}</td>
                    <td className="p-3 text-gray-400 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
                    <td className="p-3 text-center">
                      {u.id !== user?.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleResetPassword(u.id, u.username)}
                            className="text-amber-400 hover:text-amber-600" title="重置密码">
                            <Lock size={13} />
                          </button>
                          <button onClick={() => handleDeleteUser(u.id, u.username)}
                            className="text-red-400 hover:text-red-600" title="删除用户">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300">当前账号</span>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
            {users.length === 0 && <div className="p-12 text-center text-gray-400 text-xs">暂无用户</div>}

            {/* Permission Edit Modal */}
            {permEditUser && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPermEditUser(null)}>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-5" onClick={e => e.stopPropagation()}>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">
                    编辑权限 — {permEditUser.username}
                  </h3>

                  {['publish', 'posts', 'comments'].map(mod => {
                    const modLabel = mod === 'publish' ? '文章发布' : mod === 'posts' ? '文章管理' : '评论管理'
                    const hasAll = permEditPerms.includes(mod)
                    const catPerms = permEditPerms.filter(p => p.startsWith(mod + ':'))
                    return (
                      <div key={mod} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">{modLabel}</label>
                          <button onClick={() => {
                            if (hasAll) {
                              setPermEditPerms(prev => prev.filter(p => p !== mod && !p.startsWith(mod + ':')))
                            } else {
                              setPermEditPerms(prev => [...prev.filter(p => !p.startsWith(mod + ':') && p !== mod), mod])
                            }
                          }} className={`text-[10px] px-2 py-0.5 rounded border ${hasAll ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                            全部分类
                          </button>
                        </div>
                        {!hasAll && (
                          <div className="flex flex-wrap gap-2 ml-2">
                            {categories.map(c => {
                              const permKey = `${mod}:${c.slug}`
                              const checked = catPerms.includes(permKey)
                              return (
                                <label key={c.id} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                                  <input type="checkbox" checked={checked}
                                    onChange={() => {
                                      setPermEditPerms(prev => checked ? prev.filter(p => p !== permKey) : [...prev, permKey])
                                    }}
                                    className="rounded border-gray-300 text-bank-primary focus:ring-bank-primary" />
                                  {c.name}
                                </label>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <div className="mb-4">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 block">其他模块</label>
                    <div className="flex flex-wrap gap-2 ml-2">
                      {[
                        { key: 'users', label: '用户管理' },
                        { key: 'menus', label: '导航管理' },
                        { key: 'settings', label: '站点设置' },
                      ].map(m => {
                        const has = permEditPerms.includes(m.key)
                        return (
                          <label key={m.key} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={has}
                              onChange={() => setPermEditPerms(prev => has ? prev.filter(p => p !== m.key) : [...prev, m.key])}
                              className="rounded border-gray-300 text-bank-primary focus:ring-bank-primary" />
                            {m.label}
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t dark:border-gray-700">
                    <button onClick={() => setPermEditUser(null)}
                      className="px-4 py-1.5 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300">取消</button>
                    <button onClick={() => {
                      handleSaveUserRole(permEditUser.id, permEditUser.role, permEditPerms, true)
                      setPermEditUser(null)
                    }}
                      className="px-4 py-1.5 text-xs bg-bank-primary text-white rounded hover:bg-bank-dark">保存权限</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setConfirmDialog(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${confirmDialog.danger ? 'bg-red-50 dark:bg-red-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                {confirmDialog.danger
                  ? <Trash2 size={20} className="text-red-500" />
                  : <Edit size={20} className="text-blue-500" />}
              </div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">{confirmDialog.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{confirmDialog.message}</p>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2.5 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">取消</button>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null) }}
                className={`flex-1 px-4 py-2.5 text-xs font-medium rounded-xl text-white transition-colors shadow-sm ${confirmDialog.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-bank-primary hover:bg-bank-dark'}`}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
