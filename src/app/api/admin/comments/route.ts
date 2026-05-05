import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isAdmin, getAllowedCategorySlugs } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: '权限不足' }, { status: 403 })

  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const postId = searchParams.get('postId') || ''
    const category = searchParams.get('category') || ''

    const where: Record<string, unknown> = {}
    // Enforce category-level permission
    const allowedSlugs = getAllowedCategorySlugs(user.role, user.permissions, 'comments')
    if (allowedSlugs !== null) {
      if (allowedSlugs.length === 0) return NextResponse.json({ comments: [], total: 0, page: 1, totalPages: 0 })
      if (category) {
        if (!allowedSlugs.includes(category)) return NextResponse.json({ comments: [], total: 0, page: 1, totalPages: 0 })
        where.post = { category: { slug: category } }
      } else {
        where.post = { category: { slug: { in: allowedSlugs } } }
      }
    } else if (category) {
      where.post = { category: { slug: category } }
    }
    if (search) {
      where.OR = [
        { content: { contains: search } },
        { author: { username: { contains: search } } },
        { post: { title: { contains: search } } },
      ]
    }
    if (postId) {
      where.postId = parseInt(postId)
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          author: { select: { username: true } },
          post: { select: { id: true, title: true, category: { select: { name: true, slug: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ])
    return NextResponse.json({ comments, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: '权限不足' }, { status: 403 })

  try {
    const { id } = await request.json()
    await prisma.comment.deleteMany({ where: { parentId: id } })
    await prisma.comment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
