import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  return verifyToken(token)
}

export async function GET(request: NextRequest) {
  const payload = getUser(request)
  if (!payload) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        realName: true,
        role: true,
        permissions: true,
        createdAt: true,
        _count: { select: { posts: true, comments: true, petitions: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({
      ...user,
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
    })
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const payload = getUser(request)
  if (!payload) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { email, phone, realName } = body

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(realName !== undefined && { realName: realName || null }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        realName: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to update profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
