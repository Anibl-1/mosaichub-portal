'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LogIn, Eye, EyeOff, Shield, Users, FileText } from 'lucide-react'
import { useSiteSettings } from '@/lib/useSiteSettings'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const s = useSiteSettings()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '登录失败')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.location.href = '/'
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-[880px] card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Branding Panel */}
          <div className="hidden md:flex flex-col justify-center p-10 bg-gradient-to-br from-bank-primary via-[#1a3a6b] to-bank-dark text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                <Shield size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">{s.site_short_name || '企业'}<br/>信息门户</h2>
              <p className="text-sm text-blue-200 leading-relaxed mb-8">{s.site_description || `${s.site_short_name} 信息门户平台`}</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><FileText size={14} /></div>
                  <div><p className="text-sm font-medium">评论互动</p><p className="text-[10px] text-blue-200">发表评论，收藏支持文章</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Users size={14} /></div>
                  <div><p className="text-sm font-medium">意见征集</p><p className="text-[10px] text-blue-200">参与建议征集和反馈</p></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="p-8 md:p-10">
            <div className="mb-8">
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">用户登录</h1>
              <p className="text-xs text-gray-400 mt-1">请输入您的账号密码进行登录</p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs px-4 py-2.5 rounded-lg mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">用户名</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-bank-red focus:border-transparent outline-none transition-all bg-gray-50 dark:bg-gray-700/50 dark:text-gray-200 focus:bg-white dark:focus:bg-gray-700"
                  placeholder="请输入用户名"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">密码</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-bank-red focus:border-transparent outline-none transition-all pr-10 bg-gray-50 dark:bg-gray-700/50 dark:text-gray-200 focus:bg-white dark:focus:bg-gray-700"
                    placeholder="请输入密码"
                    required
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-bank-red hover:bg-bank-redDark text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <LogIn size={16} />
                {loading ? '登录中...' : '登 录'}
              </button>
            </form>

            <div className="flex items-center gap-3 mt-6">
              <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
              <span className="text-[10px] text-gray-400">其他选项</span>
              <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">
              还没有账号？<Link href="/register" className="text-bank-red hover:underline ml-1 font-medium">立即注册</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
