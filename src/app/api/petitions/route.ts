import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, isAdmin } from '@/lib/auth'

function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.split(' ')[1]
  return verifyToken(token)
}

// GET: list petitions (user sees only own, admin sees all)
export async function GET(request: NextRequest) {
  const user = getUser(request)
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const type = searchParams.get('type') // FEEDBACK or SUGGESTION
  const status = searchParams.get('status')

  const where: any = {}

  // Privacy: non-admin users can only see their own petitions
  if (!isAdmin(user.role)) {
    where.authorId = user.userId
  }

  if (type) where.type = type
  if (status) where.status = status

  const [petitions, total] = await Promise.all([
    prisma.petition.findMany({
      where,
      include: {
        author: { select: { id: true, username: true, realName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.petition.count({ where }),
  ])

  return NextResponse.json({ petitions, total, page, totalPages: Math.ceil(total / limit) })
}

// POST: create a new petition (requires login)
export async function POST(request: NextRequest) {
  const user = getUser(request)
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, content, images, attachments, type } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 })
    }

    const petition = await prisma.petition.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        images: images || null,
        attachments: attachments || null,
        type: type === 'SUGGESTION' ? 'SUGGESTION' : 'FEEDBACK',
        authorId: user.userId,
      },
    })

    return NextResponse.json(petition, { status: 201 })
  } catch (error) {
    console.error('Failed to create petition:', error)
    return NextResponse.json({ error: '提交失败' }, { status: 500 })
  }
}
