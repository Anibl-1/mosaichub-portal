import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isSuperAdmin } from '@/lib/auth'

async function requireAdmin(request: NextRequest) {
  const payload = await getAuthUser(request)
  if (!payload || !isSuperAdmin(payload.role)) return null
  return payload
}

// PUT: update menu item
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: '权限不足' }, { status: 403 })

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: '无效ID' }, { status: 400 })

  try {
    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.url !== undefined) data.url = body.url
    if (body.icon !== undefined) data.icon = body.icon
    if (body.sort !== undefined) data.sort = body.sort
    if (body.parentId !== undefined) data.parentId = body.parentId
    if (body.visible !== undefined) data.visible = body.visible

    const menu = await prisma.navMenu.update({ where: { id }, data })
    return NextResponse.json(menu)
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

// DELETE: delete menu item and children
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: '权限不足' }, { status: 403 })

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: '无效ID' }, { status: 400 })

  try {
    // Delete children first
    await prisma.navMenu.deleteMany({ where: { parentId: id } })
    await prisma.navMenu.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
