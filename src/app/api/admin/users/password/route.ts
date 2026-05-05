import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, hashPassword, isAdmin } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  const payload = await getAuthUser(request)
  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 })
  }

  try {
    const { userId, newPassword } = await request.json()
    if (!userId || !newPassword) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashPassword(newPassword) },
    })

    return NextResponse.json({ message: '密码已重置' })
  } catch (error) {
    console.error('Failed to reset password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
