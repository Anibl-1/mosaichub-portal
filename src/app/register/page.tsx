'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserPlus, Shield, CheckCircle } from 'lucide-react'
import { useSiteSettings } from '@/lib/useSiteSettings'
import { useLanguage } from '@/components/LanguageProvider'

export default function RegisterPage() {
  const { t } = useLanguage()
  const s = useSiteSettings()
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    realName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError(t('两次输入的密码不一致'))
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          email: form.email || undefined,
          phone: form.phone || undefined,
          realName: form.realName || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t('注册失败'))
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.location.href = '/'
    } catch {
      setError(t('网络错误，请稍后重试'))
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-bank-red focus:border-transparent outline-none transition-all bg-gray-50 dark:bg-gray-700/50 dark:text-gray-200 focus:bg-white dark:focus:bg-gray-700"

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-[920px] card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5">
          {/* Left Branding Panel */}
          <div className="hidden md:flex md:col-span-2 flex-col justify-center p-10 bg-gradient-to-br from-bank-red via-[#a01118] to-[#7a0d12] text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                <Shield size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">{t('加入')}<br/>{s.site_short_name || t('企业门户')}</h2>
              <p className="text-sm text-red-200 leading-relaxed mb-8">{t('注册后即可评论、互动和提交反馈')}</p>
              <div className="space-y-3">
                {['参与评论互动', '上传图片和附件', '收藏支持反对', '提交反馈建议'].map((text, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-red-200 flex-shrink-0" />
                    <span className="text-sm text-red-100">{t(text)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="md:col-span-3 p-8 md:p-10">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('新用户注册')}</h1>
              <p className="text-xs text-gray-400 mt-1">{t('填写以下信息创建您的账号')}</p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs px-4 py-2.5 rounded-lg mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('用户名')} <span className="text-red-500">*</span></label>
                  <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                    className={inputCls} placeholder={t('3-20个字符')} required minLength={3} maxLength={20} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('真实姓名')}</label>
                  <input type="text" value={form.realName} onChange={e => setForm({ ...form, realName: e.target.value })}
                    className={inputCls} placeholder={t('选填')} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('密码')} <span className="text-red-500">*</span></label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className={inputCls} placeholder={t('至少6个字符')} required minLength={6} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('确认密码')} <span className="text-red-500">*</span></label>
                  <input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    className={inputCls} placeholder={t('再次输入密码')} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('邮箱')}</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className={inputCls} placeholder={t('选填')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('手机号')}</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className={inputCls} placeholder={t('选填')} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-bank-red hover:bg-bank-redDark text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
                <UserPlus size={16} />
                {loading ? t('注册中...') : t('立即注册')}
              </button>
            </form>

            <div className="flex items-center gap-3 mt-5">
              <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
              <span className="text-[10px] text-gray-400">{t('已有账号？')}</span>
              <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
            </div>

            <p className="text-center text-xs text-gray-500 mt-3">
              <Link href="/login" className="text-bank-red hover:underline font-medium">{t('返回登录')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
