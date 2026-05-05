import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FloatingSidebar from '@/components/FloatingSidebar'
import ThemeProvider from '@/components/ThemeProvider'
import { prisma } from '@/lib/prisma'

async function getSiteMetadata(): Promise<Metadata> {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ['site_name', 'site_description'] } },
    })
    const map: Record<string, string> = {}
    rows.forEach(r => { map[r.key] = r.value })
    return {
      title: map.site_name || '企业门户网站',
      description: map.site_description || '企业内部信息门户',
    }
  } catch {
    return { title: '企业门户网站', description: '企业内部信息门户' }
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return getSiteMetadata()
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Header />
          <main className="min-h-[calc(100vh-200px)]">
            {children}
          </main>
          <FloatingSidebar />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
