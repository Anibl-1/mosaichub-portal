import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isAdmin } from '@/lib/auth'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sort: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuthUser(request)
    if (!payload || !isAdmin(payload.role)) {
      return NextResponse.json({ error: '仅管理员可以创建分类' }, { status: 403 })
    }
    const { name, slug, description } = await request.json()
    if (!name || !slug) {
      return NextResponse.json({ error: '名称和标识不能为空' }, { status: 400 })
    }
    const existing = await prisma.category.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: '该标识已存在' }, { status: 400 })
    }
    const maxSort = await prisma.category.aggregate({ _max: { sort: true } })
    const category = await prisma.category.create({
      data: { name, slug, description: description || '', sort: (maxSort._max.sort || 0) + 1 },
    })
    return NextResponse.json(category)
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json({ error: '创建分类失败' }, { status: 500 })
  }
}
