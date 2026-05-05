import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: get reaction counts and current user's reactions for a post
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const postId = parseInt(params.id)
  if (isNaN(postId)) return NextResponse.json({ error: '无效的文章ID' }, { status: 400 })

  // Get counts
  const [favoriteCount, supportCount, opposeCount] = await Promise.all([
    prisma.postReaction.count({ where: { postId, type: 'FAVORITE' } }),
    prisma.postReaction.count({ where: { postId, type: 'SUPPORT' } }),
    prisma.postReaction.count({ where: { postId, type: 'OPPOSE' } }),
  ])

  // Check current user's reactions
  let userReactions: string[] = []
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    if (payload) {
      const reactions = await prisma.postReaction.findMany({
        where: { postId, userId: payload.userId },
        select: { type: true },
      })
      userReactions = reactions.map((r: { type: string }) => r.type)
    }
  }

  return NextResponse.json({
    favorite: favoriteCount,
    support: supportCount,
    oppose: opposeCount,
    userReactions,
  })
}

// POST: toggle a reaction (add/remove)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const token = authHeader.split(' ')[1]
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: '登录已过期' }, { status: 401 })

  const postId = parseInt(params.id)
  if (isNaN(postId)) return NextResponse.json({ error: '无效的文章ID' }, { status: 400 })

  try {
    const { type } = await request.json()
    if (!['FAVORITE', 'SUPPORT', 'OPPOSE'].includes(type)) {
      return NextResponse.json({ error: '无效的操作类型' }, { status: 400 })
    }

    // Check if reaction already exists
    const existing = await prisma.postReaction.findUnique({
      where: {
        postId_userId_type: {
          postId,
          userId: payload.userId,
          type,
        },
      },
    })

    if (existing) {
      // Remove reaction (toggle off)
      await prisma.postReaction.delete({ where: { id: existing.id } })
      return NextResponse.json({ action: 'removed', type })
    } else {
      // Add reaction (toggle on)
      await prisma.postReaction.create({
        data: { type, postId, userId: payload.userId },
      })
      return NextResponse.json({ action: 'added', type })
    }
  } catch (error) {
    console.error('Reaction error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
