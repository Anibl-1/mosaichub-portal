import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isSuperAdmin } from '@/lib/auth'

// GET: return menu tree (public, only visible items)
export async function GET() {
  try {
    const menus = await prisma.navMenu.findMany({
      where: { parentId: null, visible: true },
      include: {
        children: {
          where: { visible: true },
          orderBy: { sort: 'asc' },
        },
      },
      orderBy: { sort: 'asc' },
    })
    return NextResponse.json(menus)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: create menu item (admin only)
export async function POST(request: NextRequest) {
  const payload = await getAuthUser(request)
  if (!payload || !isSuperAdmin(payload.role)) return NextResponse.json({ error: '仅超级管理员可管理导航' }, { status: 403 })

  try {
    const { name, url, icon, sort, parentId, visible } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: '菜单名称不能为空' }, { status: 400 })

    const menu = await prisma.navMenu.create({
      data: {
        name: name.trim(),
        url: url || null,
        icon: icon || null,
        sort: sort || 0,
        parentId: parentId || null,
        visible: visible !== false,
      },
    })
    return NextResponse.json(menu, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
