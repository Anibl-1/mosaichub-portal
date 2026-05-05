import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET: get current user's preference(s)
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = request.nextUrl.searchParams.get('key')
  try {
    if (key) {
      const pref = await prisma.userPreference.findUnique({
        where: { userId_key: { userId: user.userId, key } },
      })
      return NextResponse.json({ key, value: pref?.value || '' })
    }
    const prefs = await prisma.userPreference.findMany({
      where: { userId: user.userId },
    })
    const map: Record<string, string> = {}
    prefs.forEach(p => { map[p.key] = p.value })
    return NextResponse.json(map)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: set a preference for current user
export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { key, value } = await request.json()
    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    }
    await prisma.userPreference.upsert({
      where: { userId_key: { userId: user.userId, key } },
      update: { value: String(value || '') },
      create: { userId: user.userId, key, value: String(value || '') },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
