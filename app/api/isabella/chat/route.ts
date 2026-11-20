import { generateText, gateway } from 'ai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MODEL_CATALOG_URL = 'https://ai-gateway.vercel.sh/v1/models'
const MAX_FREE_MODELS = 12
const MAX_MESSAGES = 20
const MAX_MESSAGE_CHARS = 2_000
const WINDOW_MS = 60_000
const MAX_REQUESTS = 12
const requestWindows = new Map<string, { count: number; resetAt: number }>()
const lenses = new Set(['general', 'territorial', 'epistemic', 'security', 'governance'])

type ChatMessage = { role: 'user' | 'assistant'; content: string }

function jsonError(message: string, status: number, retryAfter?: number) {
  const response = NextResponse.json({ error: message }, { status })
  if (retryAfter) response.headers.set('Retry-After', String(retryAfter))
  return response
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwardedHost || request.headers.get('host')
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return false
    } catch {
      return false
    }
  }
  return request.headers.get('sec-fetch-site') !== 'cross-site'
}

function allowRequest(request: Request) {
  const now = Date.now()
  const key = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  let window = requestWindows.get(key)
  if (!window || window.resetAt <= now) {
    window = { count: 0, resetAt: now + WINDOW_MS }
    requestWindows.set(key, window)
  }
  if (requestWindows.size > 500) {
    for (const [address, value] of requestWindows) {
      if (value.resetAt <= now) requestWindows.delete(address)
    }
  }
  window.count += 1
  return { allowed: window.count <= MAX_REQUESTS, retryAfter: Math.ceil((window.resetAt - now) / 1_000) }
}

function parseMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) return null
  const messages: ChatMessage[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') return null
    const role = (item as Record<string, unknown>).role
    const content = (item as Record<string, unknown>).content
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null
    const trimmed = content.trim()
    if (!trimmed || trimmed.length > MAX_MESSAGE_CHARS) return null
    messages.push({ role, content: trimmed })
  }
  return messages.at(-1)?.role === 'user' ? messages : null
}

function lensInstruction(lens: string) {
  const instructions: Record<string, string> = {
    general: 'Prioriza claridad, contexto y pasos concretos.',
    territorial: 'Considera el contexto territorial y cultural latinoamericano sin generalizar comunidades ni inventar datos locales.',
    epistemic: 'Separa hechos, inferencias e incertidumbres; señala qué evidencia primaria haría falta.',
    security: 'Evalúa amenazas y mitigaciones de forma defensiva. No proporciones instrucciones para atacar sistemas reales.',
    governance: 'Explica responsabilidades, autoridad, supervisión humana y límites institucionales.',
  }
  return instructions[lens] || instructions.general
}

type CatalogModel = {
  id: string
  type?: string
  tags?: string[]
  pricing?: { input?: string; output?: string; varies_by_provider?: boolean }
}

async function getFreeOpenModels(): Promise<string[]> {
  const response = await fetch(MODEL_CATALOG_URL, {
    cache: 'no-store',
    signal: AbortSignal.timeout(5_000),
  })
  if (!response.ok) throw new Error('Model catalog unavailable')

  const catalog = (await response.json()) as { data?: CatalogModel[] }
  return (catalog.data || [])
    .filter((model) =>
      model.type === 'language' &&
      model.tags?.includes('open-weights') &&
      model.pricing?.input === '0' &&
      model.pricing?.output === '0' &&
      !model.pricing.varies_by_provider,
    )
    .slice(0, MAX_FREE_MODELS)
    .map((model) => model.id)
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError('Solicitud de origen no permitido.', 403)
  const limit = allowRequest(request)
  if (!limit.allowed) return jsonError('Se alcanzó el límite de consultas. Inténtalo de nuevo en un momento.', 429, limit.retryAfter)
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > 48_000) return jsonError('La conversación supera el límite permitido.', 413)

  let body: { messages?: unknown; lens?: unknown }
  try {
    body = await request.json()
  } catch {
    return jsonError('El cuerpo de la solicitud no contiene JSON válido.', 400)
  }

  const messages = parseMessages(body.messages)
  if (!messages) return jsonError('La conversación no es válida o excede sus límites.', 400)
  const lens = typeof body.lens === 'string' && lenses.has(body.lens) ? body.lens : 'general'

  let models: string[]
  try {
    models = await getFreeOpenModels()
  } catch (error) {
    console.error('[Isabella] Free model catalog unavailable:', error instanceof Error ? error.name : 'unknown')
    return jsonError('No se pudo verificar qué modelos siguen siendo gratuitos. No se usó ningún modelo de pago; inténtalo de nuevo.', 503)
  }
  if (models.length === 0) {
    return jsonError('Por ahora no hay modelos abiertos gratuitos disponibles. No se usó ningún modelo de pago.', 503)
  }

  const generationDeadline = Date.now() + 48_000
  let lastError: unknown
  for (const model of models) {
    const remainingMs = generationDeadline - Date.now()
    if (remainingMs <= 1_000) break

    try {
      const result = await generateText({
        model: gateway(model),
        system: [
          'Eres Isabella Villaseñor AI, una asistente de TAMV Online Network. Responde en español salvo que la persona pida otro idioma. Sé clara, respetuosa y útil; distingue hechos, inferencias y dudas, y no inventes fuentes ni capacidades.',
          'No afirmes que accediste a datos privados, repositorios, cuentas, memoria persistente ni herramientas. No emitas decisiones oficiales ni ejecutes acciones. En asuntos sensibles, explica límites y deriva las decisiones a revisión humana.',
          `Enfoque de respuesta: ${lensInstruction(lens)}`,
        ].join('\n\n'),
        messages,
        maxOutputTokens: 900,
        temperature: 0.3,
        abortSignal: AbortSignal.timeout(Math.min(12_000, remainingMs)),
      })

      if (result.text.trim()) {
        return NextResponse.json({ answer: result.text.trim(), model })
      }
      lastError = new Error('Empty model response')
    } catch (error) {
      lastError = error
      console.warn('[Isabella] Free model unavailable; trying next:', model, error instanceof Error ? error.name : 'unknown')
    }
  }

  if (lastError instanceof Error && /valid credit card|unlock your free credits/i.test(lastError.message)) {
    return jsonError('El AI Gateway no habilita estos modelos gratuitos en el estado actual de la cuenta. No se recurrió a modelos de pago.', 503)
  }
  console.error('[Isabella] All free models failed:', lastError instanceof Error ? lastError.name : 'unknown')
  return jsonError('Se agotaron los modelos gratuitos disponibles en este intento. No se usó ningún modelo de pago; inténtalo de nuevo más tarde.', 503)
}
