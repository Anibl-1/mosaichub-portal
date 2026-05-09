'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, Mail, Phone, Shield, Calendar, Edit3, FileText, MessageSquare, Home, Settings, PenSquare, AlertTriangle, Megaphone, ChevronRight, Lock, Eye, EyeOff } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import { formatLocaleDate } from '@/lib/i18n'

interface UserInfo {
  id: number
  username: string
  email: string | null
  phone: string | null
  realName: string | null
  role: string
  createdAt: string
}

export default function ProfilePage() {
  const { language, t } = useLanguage()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ email: '', phone: '', realName: '' })
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState({ posts: 0, comments: 0, petitions: 0 })
  const [showPwdForm, setShowPwdForm] = useState(false)
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdMsgType, setPwdMsgType] = useState<'success' | 'error'>('success')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }
    fetchProfile(token)
  }, [])

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setForm({
          email: data.email || '',
          phone: data.phone || '',
          realName: data.realName || '',
        })
        if (data._count) {
          setStats({
            posts: data._count.posts || 0,
            comments: data._count.comments || 0,
            petitions: data._count.petitions || 0,
          })
        }
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    } catch {
      console.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setEditing(false)
        setMessage(t('个人信息更新成功'))
      } else {
        const data = await res.json()
        setMessage(data.error || t('更新失败'))
      }
    } catch {
      setMessage(t('网络错误'))
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdMsg('')
    if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      setPwdMsg(t('请填写完整信息')); setPwdMsgType('error'); return
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdMsg(t('新密码长度至少6位')); setPwdMsgType('error'); return
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg(t('两次输入的新密码不一致')); setPwdMsgType('error'); return
    }
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setPwdMsg(t('密码修改成功')); setPwdMsgType('success')
        setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
        setTimeout(() => setShowPwdForm(false), 1500)
      } else {
        setPwdMsg(data.error || t('修改失败')); setPwdMsgType('error')
      }
    } catch {
      setPwdMsg(t('网络错误')); setPwdMsgType('error')
    }
  }

  const daysSinceRegistration = user ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>)}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/" className="hover:text-bank-red flex items-center gap-1"><Home size={11} />{t('首页')}</Link>
        <span>&gt;</span>
        <span className="text-gray-700 dark:text-gray-300">{t('个人中心')}</span>
      </div>

      {/* Profile Hero */}
      <div className="card mb-5 overflow-hidden">
        <div className="bg-gradient-to-r from-bank-primary via-bank-dark to-bank-primary p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
            <div className="w-24 h-24 bg-white/15 rounded-2xl flex items-center justify-center text-4xl font-black text-white backdrop-blur-sm border border-white/10 flex-shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 data-no-translate className="text-2xl font-bold text-white">{user.realName || user.username}</h1>
              <p className="text-blue-200 text-sm mt-1">@{user.username}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full ${user.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-200' : user.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-200' : 'bg-white/10 text-blue-200'}`}>
                  <Shield size={11} />{user.role === 'SUPER_ADMIN' ? t('超级管理员') : user.role === 'ADMIN' ? t('系统管理员') : t('普通用户')}
                </span>
                <span className="text-xs text-blue-200/60 flex items-center gap-1">
                  <Calendar size={11} />{language === 'en' ? `Registered ${daysSinceRegistration} days ago` : `已注册 ${daysSinceRegistration} 天`}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(!editing)}
                className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
                <Edit3 size={12} />{editing ? t('取消编辑') : t('编辑资料')}
              </button>
              {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                <Link href="/admin" className="flex items-center gap-1.5 text-xs bg-bank-red/80 hover:bg-bank-red text-white px-4 py-2 rounded-lg transition-colors">
                  <Settings size={12} />{t('管理中心')}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 divide-x dark:divide-gray-700">
          {[
            { label: t('文章数'), value: stats.posts, icon: <FileText size={16} className="text-bank-primary" /> },
            { label: t('评论数'), value: stats.comments, icon: <MessageSquare size={16} className="text-green-500" /> },
            { label: t('信访/建议'), value: stats.petitions, icon: <AlertTriangle size={16} className="text-amber-500" /> },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-center gap-3 py-4 px-2">
              {item.icon}
              <div>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{item.value}</p>
                <p className="text-[10px] text-gray-400">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.includes('成功') ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Content */}
        <div className="lg:col-span-8">
          <div className="card">
            <div className="section-header">
              <span className="text-sm font-bold">{editing ? t('编辑个人信息') : t('个人信息')}</span>
            </div>

            {!editing ? (
              <div className="divide-y dark:divide-gray-700">
                {[
                  { icon: <User size={16} className="text-bank-primary" />, label: t('真实姓名'), value: user.realName || t('未填写') },
                  { icon: <Mail size={16} className="text-bank-primary" />, label: t('邮箱地址'), value: user.email || t('未填写') },
                  { icon: <Phone size={16} className="text-bank-primary" />, label: t('手机号码'), value: user.phone || t('未填写') },
                  { icon: <Shield size={16} className="text-bank-primary" />, label: t('账户角色'), value: user.role === 'SUPER_ADMIN' ? t('超级管理员') : user.role === 'ADMIN' ? t('系统管理员') : t('普通用户') },
                  { icon: <Calendar size={16} className="text-bank-primary" />, label: t('注册时间'), value: formatLocaleDate(user.createdAt, language, { year: 'numeric', month: 'long', day: 'numeric' }) },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 bg-bank-primary/5 dark:bg-bank-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-gray-400">{item.label}</p>
                      <p data-no-translate={item.label === t('真实姓名') || item.label === t('邮箱地址') || item.label === t('手机号码') ? true : undefined} className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={handleUpdate} className="p-5 space-y-4">
                {[
                  { label: t('真实姓名'), key: 'realName' as const, type: 'text', placeholder: t('请输入真实姓名') },
                  { label: t('邮箱地址'), key: 'email' as const, type: 'email', placeholder: t('请输入邮箱地址') },
                  { label: t('手机号码'), key: 'phone' as const, type: 'tel', placeholder: t('请输入手机号码') },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{field.label}</label>
                    <input
                      type={field.type}
                      value={form[field.key]}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-bank-primary focus:border-transparent outline-none"
                    />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary flex items-center gap-2"><Edit3 size={14} />{t('保存修改')}</button>
                  <button type="button" onClick={() => setEditing(false)}
                    className="px-6 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-600 dark:text-gray-300 transition-colors">{t('取消')}</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Quick Actions */}
          <div className="card">
            <div className="section-header-red">
              <span className="text-sm font-bold">{t('快捷操作')}</span>
            </div>
            <div className="p-3 space-y-1">
              {[
                { href: '/post/create', label: t('发布文章'), icon: <PenSquare size={14} className="text-blue-500" /> },
                { href: '/petition?type=feedback', label: t('提交反馈'), icon: <AlertTriangle size={14} className="text-bank-red" /> },
                { href: '/petition?type=suggestion', label: t('提交建议'), icon: <Megaphone size={14} className="text-amber-500" /> },
                { href: '/search', label: t('搜索文章'), icon: <FileText size={14} className="text-green-500" /> },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                  <span className="flex items-center gap-2.5">{item.icon}{item.label}</span>
                  <ChevronRight size={12} className="text-gray-300 group-hover:text-bank-red transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Account Security */}
          <div className="card">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('账户安全')}</h3>
                <button onClick={() => { setShowPwdForm(!showPwdForm); setPwdMsg('') }}
                  className="text-[10px] text-bank-primary hover:text-bank-red transition-colors flex items-center gap-1">
                  <Lock size={10} />{showPwdForm ? t('收起') : t('修改密码')}
                </button>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">{t('登录密码')}</span>
                  <span className="text-green-500">{t('已设置')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">{t('手机绑定')}</span>
                  <span className={user.phone ? 'text-green-500' : 'text-gray-300'}>{user.phone ? t('已绑定') : t('未绑定')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">{t('邮箱绑定')}</span>
                  <span className={user.email ? 'text-green-500' : 'text-gray-300'}>{user.email ? t('已绑定') : t('未绑定')}</span>
                </div>
              </div>
            </div>
            {showPwdForm && (
              <div className="border-t dark:border-gray-700 p-4">
                {pwdMsg && (
                  <div className={`mb-3 px-3 py-2 rounded text-xs ${pwdMsgType === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
                    {pwdMsg}
                  </div>
                )}
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('原密码')}</label>
                    <div className="relative">
                      <input
                        type={showOld ? 'text' : 'password'}
                        value={pwdForm.oldPassword}
                        onChange={e => setPwdForm({ ...pwdForm, oldPassword: e.target.value })}
                        placeholder={t('请输入原密码')}
                        className="w-full px-3 py-2 pr-9 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-bank-primary focus:border-transparent outline-none"
                      />
                      <button type="button" onClick={() => setShowOld(!showOld)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('新密码')}</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={pwdForm.newPassword}
                        onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                        placeholder={t('请输入新密码（至少6位）')}
                        className="w-full px-3 py-2 pr-9 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-bank-primary focus:border-transparent outline-none"
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('确认新密码')}</label>
                    <input
                      type="password"
                      value={pwdForm.confirmPassword}
                      onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                      placeholder={t('请再次输入新密码')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-bank-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <button type="submit" className="w-full btn-red text-xs py-2 flex items-center justify-center gap-1.5">
                    <Lock size={12} />{t('确认修改密码')}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Tip */}
          <div className="card p-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              <strong className="text-gray-600 dark:text-gray-400">{t('安全提示：')}</strong>{t('请妥善保管您的账户信息，定期修改密码，不要将密码透露给他人。如有账户异常，请及时联系客服。')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
