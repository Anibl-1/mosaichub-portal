import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isAdmin } from '@/lib/auth'

async function getAuth(request: NextRequest) {
  const payload = await getAuthUser(request)
  if (!payload || !isAdmin(payload.role)) return null
  return payload
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuth(request)
  if (!auth) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { title, content, summary, categoryId, isTop, topSort, status, coverImage } = body

    // Non-super-admin can only edit their own posts
    if (auth.role !== 'SUPER_ADMIN') {
      const existing = await prisma.post.findUnique({ where: { id: parseInt(params.id) }, select: { authorId: true } })
      if (!existing || existing.authorId !== auth.userId) {
        return NextResponse.json({ error: '只能编辑自己的文章' }, { status: 403 })
      }
    }

    const post = await prisma.post.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(summary !== undefined && { summary }),
        ...(categoryId && { categoryId }),
        ...(isTop !== undefined && { isTop }),
        ...(topSort !== undefined && { topSort }),
        ...(status && { status }),
        ...(coverImage !== undefined && { coverImage }),
      },
      include: {
        category: { select: { name: true, slug: true } },
        author: { select: { username: true } },
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Failed to update post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await getAuth(request))) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  try {
    const pid = parseInt(params.id)
    await prisma.postReaction.deleteMany({ where: { postId: pid } })
    await prisma.comment.deleteMany({ where: { postId: pid } })
    await prisma.post.delete({ where: { id: pid } })
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('Failed to delete post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
