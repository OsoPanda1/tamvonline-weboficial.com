import { generateText, gateway } from 'ai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MODEL = 'google/gemini-3.8-flash'
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

  try {
    const result = await generateText({
      model: gateway(MODEL),
      system: [
        'Eres Isabella Villaseñor AI, una asistente de TAMV Online Network. Responde en español salvo que la persona pida otro idioma. Sé clara, respetuosa y útil; distingue hechos, inferencias y dudas, y no inventes fuentes ni capacidades.',
        'No afirmes que accediste a datos privados, repositorios, cuentas, memoria persistente ni herramientas. No emitas decisiones oficiales ni ejecutes acciones. En asuntos sensibles, explica límites y deriva las decisiones a revisión humana.',
        `Enfoque de respuesta: ${lensInstruction(lens)}`,
      ].join('\n\n'),
      messages,
      maxOutputTokens: 900,
      temperature: 0.3,
      abortSignal: AbortSignal.timeout(45_000),
    })

    if (!result.text.trim()) return jsonError('Isabella no recibió una respuesta utilizable del modelo.', 502)
    return NextResponse.json({ answer: result.text.trim(), model: MODEL })
  } catch (error) {
    if (error instanceof Error && /valid credit card|unlock your free credits/i.test(error.message)) {
      return jsonError('El AI Gateway necesita facturación activa en el equipo de Vercel. Configura un método de pago y vuelve a intentarlo.', 503)
    }
    console.error('[Isabella] AI Gateway request failed:', error instanceof Error ? error.name : 'unknown')
    return jsonError('Isabella no pudo conectarse al modelo en este momento. Inténtalo de nuevo.', 502)
  }
}
