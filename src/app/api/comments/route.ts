import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '请先登录后再评论' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 })
    }

    const body = await request.json()
    const { content, postId, parentId, images } = body

    if (!content || !postId) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 })
    }

    // Sensitive word check
    const sensitiveWordsConfig = await prisma.siteSetting.findUnique({ where: { key: 'sensitive_words' } })
    if (sensitiveWordsConfig?.value) {
      const words = sensitiveWordsConfig.value.split(/[,，\n]/).map((w: string) => w.trim()).filter(Boolean)
      const contentLower = content.toLowerCase()
      const matched = words.find((w: string) => contentLower.includes(w.toLowerCase()))
      if (matched) {
        return NextResponse.json({ error: `评论包含敏感词「${matched}」，请修改后重试` }, { status: 400 })
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        images: images ? JSON.stringify(images) : null,
        postId,
        authorId: payload.userId,
        parentId: parentId || null,
      },
      include: {
        author: { select: { username: true, avatar: true } },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Failed to create comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
