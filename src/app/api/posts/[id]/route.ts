import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const post = await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { username: true, avatar: true } },
        comments: {
          include: {
            author: { select: { username: true, avatar: true } },
            replies: {
              include: {
                author: { select: { username: true, avatar: true } },
              },
            },
          },
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Failed to fetch post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
