'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { LANGUAGE_STORAGE_KEY, Language, translateText } from '@/lib/i18n'

const textNodesToSkip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE'])
const attrNames = ['placeholder', 'title', 'aria-label', 'alt'] as const
const originalTextByNode = new WeakMap<Text, string>()

const LanguageContext = createContext<{
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
  t: (value: string) => string
}>({
  language: 'zh-CN',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: value => value,
})

function walkAndTranslate(root: ParentNode, language: Language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent || textNodesToSkip.has(parent.tagName)) return NodeFilter.FILTER_REJECT
      if (parent.closest('[data-no-translate]')) return NodeFilter.FILTER_REJECT
      if (!node.nodeValue) return NodeFilter.FILTER_SKIP
      if (!/[\u4e00-\u9fff]/.test(node.nodeValue) && !originalTextByNode.has(node as Text)) return NodeFilter.FILTER_SKIP
      return NodeFilter.FILTER_ACCEPT
    },
  })

  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)

  nodes.forEach(node => {
    const current = node.nodeValue || ''
    const cached = originalTextByNode.get(node)
    const original = /[\u4e00-\u9fff]/.test(current) ? current : cached
    if (!original) return
    originalTextByNode.set(node, original)
    const translated = translateText(original, language)
    if (node.nodeValue !== translated) node.nodeValue = translated
  })

  document.querySelectorAll<HTMLElement>('*').forEach(el => {
    if (el.closest('[data-no-translate]')) return
    attrNames.forEach(attr => {
      const current = el.getAttribute(attr)
      if (!current) return
      const dataKey = `i18nOriginal${attr.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}`
      const original = el.dataset[dataKey] || current
      if (!/[\u4e00-\u9fff]/.test(original)) return
      if (!el.dataset[dataKey]) el.dataset[dataKey] = original
      const translated = translateText(original, language)
      if (current !== translated) el.setAttribute(attr, translated)
    })
  })
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh-CN')

  useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null
    if (saved === 'en' || saved === 'zh-CN') setLanguageState(saved)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    walkAndTranslate(document.body, language)

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(() => walkAndTranslate(document.body, language))
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...attrNames],
    })

    return () => observer.disconnect()
  }, [language])

  const value = useMemo(() => ({
    language,
    setLanguage: (next: Language) => setLanguageState(next),
    toggleLanguage: () => setLanguageState(prev => prev === 'zh-CN' ? 'en' : 'zh-CN'),
    t: (text: string) => translateText(text, language),
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => useContext(LanguageContext)
