import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { decrypt, isEncrypted } from '@/lib/crypto'

const TIMEOUT_MS = 120_000 // 2 min timeout for AI requests

// Supported provider configurations
const PROVIDER_CONFIGS: Record<string, { defaultBase: string; chatPath: string }> = {
  openai:    { defaultBase: 'https://api.openai.com/v1',        chatPath: '/chat/completions' },
  anthropic: { defaultBase: 'https://api.anthropic.com/v1',     chatPath: '/messages' },
  gemini:    { defaultBase: 'https://generativelanguage.googleapis.com/v1beta', chatPath: '' },
  qwen:      { defaultBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1', chatPath: '/chat/completions' },
  deepseek:  { defaultBase: 'https://api.deepseek.com',         chatPath: '/chat/completions' },
  moonshot:  { defaultBase: 'https://api.moonshot.cn/v1',       chatPath: '/chat/completions' },
  zhipu:     { defaultBase: 'https://open.bigmodel.cn/api/paas/v4', chatPath: '/chat/completions' },
  baidu:     { defaultBase: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop', chatPath: '/chat/completions' },
  custom:    { defaultBase: '',                                  chatPath: '/chat/completions' },
}

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer))
}

function safeParse(json: string): Record<string, unknown> | null {
  try { return JSON.parse(json) } catch { return null }
}

export async function POST(request: NextRequest) {
  const payload = await getAuthUser(request)
  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
  }

  let body: { messages?: unknown; systemPrompt?: string; maxTokens?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '请求体格式错误' }, { status: 400 })
  }

  const { messages, systemPrompt } = body
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: '消息不能为空' }, { status: 400 })
  }
  // Validate each message
  for (const m of messages) {
    if (!m.role || !m.content || typeof m.content !== 'string') {
      return NextResponse.json({ error: '消息格式错误，每条需包含 role 和 content' }, { status: 400 })
    }
  }

  try {
    // Load AI config from site_settings (decrypt if encrypted)
    const setting = await prisma.siteSetting.findUnique({ where: { key: 'ai_config' } })
    if (!setting?.value) {
      return NextResponse.json({ error: '请先在管理后台「站点设置 → AI 智能助手配置」中配置 AI 模型' }, { status: 400 })
    }

    let configStr = setting.value
    if (isEncrypted(configStr)) {
      try { configStr = decrypt(configStr) } catch { return NextResponse.json({ error: 'AI 配置解密失败，请重新保存配置' }, { status: 500 }) }
    }
    const config = safeParse(configStr)
    if (!config) {
      return NextResponse.json({ error: 'AI 配置数据损坏，请重新保存配置' }, { status: 500 })
    }

    const provider = (config.provider as string) || 'openai'
    const apiKey = (config.apiKey as string) || ''
    const apiBase = (config.apiBase as string) || ''
    const model = (config.model as string) || ''
    const temperature = Number(config.temperature ?? 0.7)
    const maxTokens = Number(body.maxTokens ?? config.maxTokens ?? 4096)

    if (!apiKey) {
      return NextResponse.json({ error: 'AI API Key 未配置，请前往「站点设置」填写' }, { status: 400 })
    }
    if (!model) {
      return NextResponse.json({ error: 'AI 模型未选择，请前往「站点设置」选择模型' }, { status: 400 })
    }

    const providerConfig = PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.custom
    const baseUrl = (apiBase || providerConfig.defaultBase).replace(/\/+$/, '')

    if (!baseUrl) {
      return NextResponse.json({ error: 'API 地址为空，请填写正确的 API 地址' }, { status: 400 })
    }

    // Build messages with optional system prompt
    const fullMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages

    // Handle different providers
    if (provider === 'anthropic') {
      return await handleAnthropic(baseUrl, apiKey, model, fullMessages, temperature, maxTokens)
    } else if (provider === 'gemini') {
      return await handleGemini(baseUrl, apiKey, model, fullMessages, temperature, maxTokens)
    } else {
      // OpenAI-compatible (openai, qwen, deepseek, moonshot, zhipu, custom)
      return await handleOpenAICompatible(baseUrl + providerConfig.chatPath, apiKey, model, fullMessages, temperature, maxTokens)
    }
  } catch (error: unknown) {
    console.error('AI chat error:', error)
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'AI 请求超时（120秒），请稍后重试或切换更快的模型' }, { status: 504 })
    }
    const msg = error instanceof Error ? error.message : 'AI 请求失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

async function handleOpenAICompatible(url: string, apiKey: string, model: string, messages: Array<{role: string; content: string}>, temperature: number, maxTokens: number) {
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown error')
    console.error('OpenAI-compatible API error:', res.status, errText)
    // Try to extract a readable error message
    const parsed = safeParse(errText)
    const detail = (parsed?.error as { message?: string })?.message || errText.slice(0, 200)
    return NextResponse.json({ error: `AI 服务错误 (${res.status}): ${detail}` }, { status: 502 })
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (content === undefined || content === null) {
    console.error('OpenAI-compatible empty response:', JSON.stringify(data).slice(0, 500))
    return NextResponse.json({ error: 'AI 返回了空内容，请检查模型名称是否正确' }, { status: 502 })
  }
  return NextResponse.json({ content, usage: data.usage })
}

async function handleAnthropic(baseUrl: string, apiKey: string, model: string, messages: Array<{role: string; content: string}>, temperature: number, maxTokens: number) {
  // Extract system message
  const systemMsg = messages.find(m => m.role === 'system')?.content || ''
  const userMessages = messages.filter(m => m.role !== 'system')

  const res = await fetchWithTimeout(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system: systemMsg || undefined,
      messages: userMessages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown error')
    console.error('Anthropic API error:', res.status, errText)
    const parsed = safeParse(errText)
    const detail = (parsed?.error as { message?: string })?.message || errText.slice(0, 200)
    return NextResponse.json({ error: `Claude 错误 (${res.status}): ${detail}` }, { status: 502 })
  }

  const data = await res.json()
  const content = data.content?.[0]?.text
  if (!content) {
    return NextResponse.json({ error: 'Claude 返回了空内容' }, { status: 502 })
  }
  return NextResponse.json({ content, usage: data.usage })
}

async function handleGemini(baseUrl: string, apiKey: string, model: string, messages: Array<{role: string; content: string}>, temperature: number, maxTokens: number) {
  // Convert to Gemini format
  const systemMsg = messages.find(m => m.role === 'system')?.content || ''
  const userMsgs = messages.filter(m => m.role !== 'system')
  // Gemini requires alternating user/model; merge consecutive same-role messages
  const contents: { role: string; parts: { text: string }[] }[] = []
  for (const m of userMsgs) {
    const role = m.role === 'assistant' ? 'model' : 'user'
    const last = contents[contents.length - 1]
    if (last && last.role === role) {
      last.parts.push({ text: m.content })
    } else {
      contents.push({ role, parts: [{ text: m.content }] })
    }
  }
  // Gemini requires first message to be user
  if (contents.length > 0 && contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: '请回答以下问题：' }] })
  }

  const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown error')
    console.error('Gemini API error:', res.status, errText)
    const parsed = safeParse(errText)
    const detail = (parsed?.error as { message?: string })?.message || errText.slice(0, 200)
    return NextResponse.json({ error: `Gemini 错误 (${res.status}): ${detail}` }, { status: 502 })
  }

  const data = await res.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) {
    const blockReason = data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason
    return NextResponse.json({ error: `Gemini 返回空内容${blockReason ? `（原因: ${blockReason}）` : ''}` }, { status: 502 })
  }
  return NextResponse.json({ content })
}
