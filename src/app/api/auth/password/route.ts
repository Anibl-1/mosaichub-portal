import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, verifyPassword, hashPassword } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }
  const token = authHeader.split(' ')[1]
  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: '登录已过期' }, { status: 401 })
  }

  try {
    const { oldPassword, newPassword } = await request.json()

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码长度至少6位' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    if (!verifyPassword(oldPassword, user.password)) {
      return NextResponse.json({ error: '原密码错误' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: { password: hashPassword(newPassword) },
    })

    return NextResponse.json({ message: '密码修改成功' })
  } catch (error) {
    console.error('Failed to change password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
