import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MODEL = 'meta/meta-llama-3.1-8b-instruct'
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
  const host = request.headers.get('host')
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
  const key = request.headers.get('x-real-ip') || 'unknown'
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
  if (!process.env.REPLICATE_API_TOKEN_2) return jsonError('El servicio de conversación no está configurado en el servidor.', 503)

  let body: { messages?: unknown; lens?: unknown }
  try {
    body = await request.json()
  } catch {
    return jsonError('El cuerpo de la solicitud no contiene JSON válido.', 400)
  }

  const messages = parseMessages(body.messages)
  if (!messages) return jsonError('La conversación no es válida o excede sus límites.', 400)
  const lens = typeof body.lens === 'string' && lenses.has(body.lens) ? body.lens : 'general'
  const prompt = [
    'Eres Isabella Villaseñor AI, una asistente experimental integrada en TAMV Online Network. Responde en español salvo que la persona pida otro idioma. Sé clara, respetuosa y útil; distingue hechos, inferencias y dudas, y no inventes fuentes ni capacidades.',
    'No afirmes que accediste a datos privados, repositorios, cuentas, memoria persistente o herramientas: esta conversación solo permite generar texto. No emitas decisiones oficiales ni ejecutes acciones. En asuntos sensibles, explica límites y deriva las decisiones a revisión humana.',
    `Lente de respuesta: ${lensInstruction(lens)}`,
    ...messages.map((message) => `${message.role === 'user' ? 'Persona' : 'Isabella'}: ${message.content}`),
    'Isabella:',
  ].join('\n\n')

  try {
    const start = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN_2}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: { prompt, max_new_tokens: 900, temperature: 0.3 } }),
      signal: AbortSignal.timeout(45_000),
    })
    if (!start.ok) return jsonError('No se pudo iniciar la respuesta. Inténtalo de nuevo.', 502)

    type Prediction = { id?: string; status?: string; output?: string[] | string; urls?: { get?: string } }
    let prediction = (await start.json()) as Prediction
    for (let attempt = 0; attempt < 35 && prediction.status !== 'succeeded'; attempt += 1) {
      if (prediction.status === 'failed' || prediction.status === 'canceled') break
      const pollUrl = prediction.urls?.get || (prediction.id ? `https://api.replicate.com/v1/predictions/${prediction.id}` : '')
      if (!pollUrl) break
      await new Promise((resolve) => setTimeout(resolve, 900))
      const poll = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN_2}` },
        signal: AbortSignal.timeout(10_000),
      })
      if (!poll.ok) break
      prediction = (await poll.json()) as Prediction
    }

    if (prediction.status !== 'succeeded') return jsonError('La respuesta no terminó a tiempo. Puedes volver a intentarlo.', 504)
    const answer = Array.isArray(prediction.output) ? prediction.output.join('') : prediction.output || ''
    if (!answer.trim()) return jsonError('Isabella no recibió una respuesta utilizable del modelo.', 502)
    return NextResponse.json({ answer: answer.trim(), model: MODEL })
  } catch {
    return jsonError('El servicio de conversación no respondió. Inténtalo de nuevo.', 502)
  }
}
