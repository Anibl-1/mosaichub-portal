import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isAdmin } from '@/lib/auth'

async function getAdmin(request: NextRequest) {
  const payload = await getAuthUser(request)
  if (!payload || !isAdmin(payload.role)) return null
  return payload
}

export async function GET(request: NextRequest) {
  const admin = await getAdmin(request)
  if (!admin) return NextResponse.json({ error: '权限不足' }, { status: 403 })

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        realName: true,
        role: true,
        permissions: true,
        createdAt: true,
        _count: { select: { posts: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    const result = users.map((u: typeof users[0]) => ({
      ...u,
      permissions: u.permissions ? JSON.parse(u.permissions) : [],
    }))
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 修改用户角色和权限（仅超级管理员可操作）
export async function PUT(request: NextRequest) {
  const admin = await getAdmin(request)
  if (!admin) return NextResponse.json({ error: '权限不足' }, { status: 403 })
  if (admin.role !== 'SUPER_ADMIN') return NextResponse.json({ error: '仅超级管理员可修改用户角色和权限' }, { status: 403 })

  try {
    const { userId, role, permissions } = await request.json()
    if (!userId || !['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }
    if (userId === admin.userId) {
      return NextResponse.json({ error: '不能修改自己的角色' }, { status: 400 })
    }

    const BASE_MODULES = ['publish', 'posts', 'comments', 'users', 'menus', 'settings']
    let perms: string[] = []
    if (role === 'SUPER_ADMIN') {
      perms = BASE_MODULES
    } else if (role === 'ADMIN' && Array.isArray(permissions)) {
      // Accept both base modules (e.g. 'comments') and category-scoped (e.g. 'publish:feedback')
      perms = permissions.filter((p: string) => {
        if (BASE_MODULES.includes(p)) return true
        const [mod] = p.split(':')
        return ['publish', 'posts', 'comments'].includes(mod) && p.includes(':')
      })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role, permissions: JSON.stringify(perms) },
      select: { id: true, username: true, role: true, permissions: true },
    })
    return NextResponse.json({ ...updated, permissions: perms })
  } catch (error) {
    console.error('Failed to update user role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 删除用户（同时删除其评论、文章、信访等）
export async function DELETE(request: NextRequest) {
  const admin = await getAdmin(request)
  if (!admin) return NextResponse.json({ error: '权限不足' }, { status: 403 })

  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })
    // 不允许删除自己
    if (userId === admin.userId) {
      return NextResponse.json({ error: '不能删除自己的账号' }, { status: 400 })
    }
    // 检查用户是否存在
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    // 删除关联数据
    await prisma.userPreference.deleteMany({ where: { userId } })
    await prisma.aiChatHistory.deleteMany({ where: { userId } })
    await prisma.postReaction.deleteMany({ where: { userId } })
    await prisma.comment.deleteMany({ where: { authorId: userId } })
    await prisma.petition.deleteMany({ where: { authorId: userId } })
    // 删除用户的文章前先删评论
    const userPostIds = (await prisma.post.findMany({ where: { authorId: userId }, select: { id: true } })).map((p: { id: number }) => p.id)
    if (userPostIds.length > 0) {
      await prisma.comment.deleteMany({ where: { postId: { in: userPostIds } } })
      await prisma.postReaction.deleteMany({ where: { postId: { in: userPostIds } } })
      await prisma.post.deleteMany({ where: { authorId: userId } })
    }
    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ message: '用户已删除' })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
