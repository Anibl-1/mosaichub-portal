import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isAdmin, getAllowedCategorySlugs } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const payload = await getAuthUser(request)
  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 })
  }

  try {
    const postSlugs = getAllowedCategorySlugs(payload.role, payload.permissions, 'posts')
    const commentSlugs = getAllowedCategorySlugs(payload.role, payload.permissions, 'comments')

    const postWhere = postSlugs !== null ? { category: { slug: { in: postSlugs } } } : {}
    const commentWhere = commentSlugs !== null ? { post: { category: { slug: { in: commentSlugs } } } } : {}

    const [postCount, userCount, commentCount, totalViews] = await Promise.all([
      prisma.post.count({ where: postWhere }),
      prisma.user.count(),
      prisma.comment.count({ where: commentWhere }),
      prisma.post.aggregate({ where: postWhere, _sum: { viewCount: true } }),
    ])

    return NextResponse.json({
      postCount,
      userCount,
      commentCount,
      totalViews: totalViews._sum?.viewCount || 0,
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
