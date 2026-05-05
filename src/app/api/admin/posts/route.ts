import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isAdmin, getAllowedCategorySlugs } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const payload = await getAuthUser(request)
  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const authorId = searchParams.get('authorId') || ''

  try {
    const where: Record<string, unknown> = {}
    const isOwnPosts = authorId && parseInt(authorId) === payload.userId
    if (authorId) where.authorId = parseInt(authorId)
    // Enforce category-level permission (skip for own posts — users can always see their own)
    if (!isOwnPosts) {
      const allowedSlugs = getAllowedCategorySlugs(payload.role, payload.permissions, 'posts')
      if (allowedSlugs !== null) {
        if (allowedSlugs.length === 0) return NextResponse.json({ posts: [], total: 0, page: 1, totalPages: 0 })
        if (category) {
          if (!allowedSlugs.includes(category)) return NextResponse.json({ posts: [], total: 0, page: 1, totalPages: 0 })
          where.category = { slug: category }
        } else {
          where.category = { slug: { in: allowedSlugs } }
        }
      } else if (category) {
        where.category = { slug: category }
      }
    } else if (category) {
      where.category = { slug: category }
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { username: { contains: search } } },
      ]
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          author: { select: { username: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ])

    return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Failed to fetch admin posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
