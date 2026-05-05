import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get('category')
  const top = searchParams.get('top')
  const limit = parseInt(searchParams.get('limit') || '10')
  const page = parseInt(searchParams.get('page') || '1')

  try {
    const where: any = { status: 'PUBLISHED' }

    if (category) {
      where.category = { slug: category }
    }

    if (top === 'true') {
      where.isTop = true
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          author: { select: { username: true } },
        },
        orderBy: [{ isTop: 'desc' }, { topSort: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ])

    return NextResponse.json({
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuthUser(request)
    if (!payload) {
      return NextResponse.json({ error: '请先登录后再发布文章' }, { status: 401 })
    }

    if (!isAdmin(payload.role)) {
      return NextResponse.json({ error: '仅管理员可以发布文章' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, summary, categoryId, coverImage } = body

    if (!title || !content || !categoryId) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // Check category-level publish permission (SUPER_ADMIN bypasses)
    if (payload.role !== 'SUPER_ADMIN') {
      const perms = payload.permissions || []
      const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { slug: true } })
      const hasPublish = perms.includes('publish') || (cat && perms.includes(`publish:${cat.slug}`))
      if (!hasPublish) {
        return NextResponse.json({ error: '您没有该分类的发布权限' }, { status: 403 })
      }
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        summary: summary || null,
        coverImage: coverImage || null,
        categoryId,
        authorId: payload.userId,
        isTop: false,
      },
      include: {
        category: { select: { name: true, slug: true } },
        author: { select: { username: true } },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Failed to create post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
