import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, isAdmin } from '@/lib/auth'

function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.split(' ')[1]
  return verifyToken(token)
}

// GET: view a single petition (only author or admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUser(request)
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const petition = await prisma.petition.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        author: { select: { id: true, username: true, realName: true } },
      },
    })

    if (!petition) {
      return NextResponse.json({ error: '不存在' }, { status: 404 })
    }

    // Privacy check: only author or admin can view
    if (!isAdmin(user.role) && petition.authorId !== user.userId) {
      return NextResponse.json({ error: '无权查看' }, { status: 403 })
    }

    return NextResponse.json(petition)
  } catch (error) {
    console.error('Failed to fetch petition:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// PUT: admin reply or update status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUser(request)
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { reply, status } = body

    const data: any = {}
    if (reply !== undefined) {
      data.reply = reply
      data.repliedAt = new Date()
    }
    if (status) data.status = status

    const petition = await prisma.petition.update({
      where: { id: parseInt(params.id) },
      data,
      include: {
        author: { select: { id: true, username: true, realName: true } },
      },
    })

    return NextResponse.json(petition)
  } catch (error) {
    console.error('Failed to update petition:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

// DELETE: admin can delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUser(request)
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  try {
    await prisma.petition.delete({ where: { id: parseInt(params.id) } })
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('Failed to delete petition:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
