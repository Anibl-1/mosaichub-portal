import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, email, phone, realName } = body

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码为必填项' }, { status: 400 })
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: '用户名长度需在3-20个字符之间' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度不能少于6个字符' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 409 })
    }

    const hashedPassword = hashPassword(password)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email: email || null,
        phone: phone || null,
        realName: realName || null,
      },
    })

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: [],
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 })
  }
}
