import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret'

export interface TokenPayload {
  userId: number
  username: string
  role: string
}

/**
 * Verify token from request header and return latest role from DB.
 * This ensures role changes take effect immediately without re-login.
 */
export async function getAuthUser(request: NextRequest): Promise<(TokenPayload & { permissions: string[] }) | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const payload = verifyToken(token)
  if (!payload) return null
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true, permissions: true },
  })
  if (!user) return null
  return {
    ...payload,
    role: user.role,
    permissions: user.permissions ? JSON.parse(user.permissions) : [],
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export function isAdmin(role: string): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export function isSuperAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN'
}

/**
 * Get allowed category slugs for a permission module (publish/posts/comments).
 * Returns null if user has full access (SUPER_ADMIN or module-level perm like 'posts').
 * Returns string[] of allowed slugs if user has category-scoped perms like 'posts:feedback'.
 * Returns empty array if user has no access at all.
 */
export function getAllowedCategorySlugs(role: string, permissions: string[], module: string): string[] | null {
  if (role === 'SUPER_ADMIN') return null
  if (permissions.includes(module)) return null
  return permissions
    .filter(p => p.startsWith(module + ':'))
    .map(p => p.split(':')[1])
}
