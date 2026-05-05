import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Connection pooling: pool size controlled via DATABASE_URL params
// e.g. mysql://user:pass@host:3306/db?connection_limit=10&pool_timeout=10
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

// Singleton pattern: reuse client in dev to prevent hot-reload connection leaks
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown: release connections on process exit (register once)
const globalCleanup = globalThis as unknown as { __prismaCleanupRegistered?: boolean }
if (typeof process !== 'undefined' && !globalCleanup.__prismaCleanupRegistered) {
  globalCleanup.__prismaCleanupRegistered = true
  const cleanup = async () => {
    await prisma.$disconnect()
  }
  process.on('beforeExit', cleanup)
  process.on('SIGINT', async () => {
    await cleanup()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await cleanup()
    process.exit(0)
  })
}
