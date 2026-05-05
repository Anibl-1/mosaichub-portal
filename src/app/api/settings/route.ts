import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isSuperAdmin } from '@/lib/auth'
import { encrypt, decrypt, isEncrypted } from '@/lib/crypto'

// Keys that should be encrypted in the database
const ENCRYPTED_KEYS = ['ai_config']

// GET: public — get one or all settings
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')
  try {
    if (key) {
      const setting = await prisma.siteSetting.findUnique({ where: { key } })
      if (setting && ENCRYPTED_KEYS.includes(key) && setting.value && isEncrypted(setting.value)) {
        try { setting.value = decrypt(setting.value) } catch { /* return as-is if decrypt fails */ }
      }
      return NextResponse.json(setting || { key, value: '' })
    }
    const settings = await prisma.siteSetting.findMany()
    // Decrypt sensitive settings for client
    for (const s of settings) {
      if (ENCRYPTED_KEYS.includes(s.key) && s.value && isEncrypted(s.value)) {
        try { s.value = decrypt(s.value) } catch { /* skip */ }
      }
    }
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: admin only — upsert a setting
export async function PUT(request: NextRequest) {
  const payload = await getAuthUser(request)
  if (!payload || !isSuperAdmin(payload.role)) return NextResponse.json({ error: '仅超级管理员可修改站点设置' }, { status: 403 })

  try {
    const { key, value, label } = await request.json()
    if (!key?.trim()) return NextResponse.json({ error: 'key不能为空' }, { status: 400 })

    // Encrypt sensitive values before storing
    const storeValue = (ENCRYPTED_KEYS.includes(key.trim()) && value) ? encrypt(value) : (value || '')

    const setting = await prisma.siteSetting.upsert({
      where: { key: key.trim() },
      update: { value: storeValue, label: label || null },
      create: { key: key.trim(), value: storeValue, label: label || null },
    })
    return NextResponse.json(setting)
  } catch (error) {
    return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }
}
