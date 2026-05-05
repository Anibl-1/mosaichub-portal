import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { encrypt, decrypt, isEncrypted } from '@/lib/crypto'

// GET: load chat history by type (chat | designer)
export async function GET(request: NextRequest) {
  const payload = await getAuthUser(request)
  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
  }

  const type = request.nextUrl.searchParams.get('type') || 'chat'
  const sessionId = request.nextUrl.searchParams.get('sessionId')

  try {
    if (sessionId) {
      // Load specific session
      const messages = await prisma.aiChatHistory.findMany({
        where: { sessionId, type, userId: payload.userId },
        orderBy: { createdAt: 'asc' },
      })
      return NextResponse.json(messages.map(m => ({
        role: m.role,
        content: isEncrypted(m.content) ? decrypt(m.content) : m.content,
      })))
    }

    // Load latest session for this user+type
    const latest = await prisma.aiChatHistory.findFirst({
      where: { type, userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      select: { sessionId: true },
    })

    if (!latest) return NextResponse.json({ sessionId: null, messages: [] })

    const messages = await prisma.aiChatHistory.findMany({
      where: { sessionId: latest.sessionId, type, userId: payload.userId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      sessionId: latest.sessionId,
      messages: messages.map(m => ({
        role: m.role,
        content: isEncrypted(m.content) ? decrypt(m.content) : m.content,
      })),
    })
  } catch (error) {
    console.error('AI history load error:', error)
    return NextResponse.json({ error: '加载对话历史失败' }, { status: 500 })
  }
}

// POST: save chat messages
export async function POST(request: NextRequest) {
  const payload = await getAuthUser(request)
  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
  }

  try {
    const { type, sessionId, messages } = await request.json() as {
      type: string
      sessionId: string
      messages: { role: string; content: string }[]
    }

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    // Delete old messages for this session, then insert new
    await prisma.aiChatHistory.deleteMany({
      where: { sessionId, type: type || 'chat', userId: payload.userId },
    })

    if (messages.length > 0) {
      await prisma.aiChatHistory.createMany({
        data: messages.map(m => ({
          sessionId,
          type: type || 'chat',
          role: m.role,
          content: encrypt(m.content),
          userId: payload.userId,
        })),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('AI history save error:', error)
    return NextResponse.json({ error: '保存对话历史失败' }, { status: 500 })
  }
}

// DELETE: clear chat history
export async function DELETE(request: NextRequest) {
  const payload = await getAuthUser(request)
  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
  }

  const type = request.nextUrl.searchParams.get('type') || 'chat'
  const sessionId = request.nextUrl.searchParams.get('sessionId')

  try {
    const where: { userId: number; type: string; sessionId?: string } = {
      userId: payload.userId,
      type,
    }
    if (sessionId) where.sessionId = sessionId

    await prisma.aiChatHistory.deleteMany({ where })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('AI history delete error:', error)
    return NextResponse.json({ error: '删除对话历史失败' }, { status: 500 })
  }
}
