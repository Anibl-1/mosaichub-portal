import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const isValid = verifyPassword(password, user.password)

    if (!isValid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    const permissions = user.permissions ? JSON.parse(user.permissions) : []

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 })
  }
}
