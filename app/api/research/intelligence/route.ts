import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = 'meta/meta-llama-3.1-8b-instruct'

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(request: Request) {
  if (!process.env.REPLICATE_API_TOKEN_2) return NextResponse.json({ error: 'Replicate no está configurado en el servidor.' }, { status: 503 })
  let body: { query?: unknown; context?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }) }
  const query = clean(body.query, 240)
  const context = clean(body.context, 6000)
  if (query.length < 3) return NextResponse.json({ error: 'Escribe una pregunta de investigación.' }, { status: 400 })

  const prompt = `Eres el analista de evidencia de TAMV. Responde en español con rigor, separa hechos de hipótesis y no inventes fuentes. Organiza la respuesta con: Hallazgo central, Implicaciones sistémicas, Riesgos o límites, Próximas preguntas.\n\nPregunta: ${query}\n\nContexto documental: ${context || 'Sin resultados documentales adjuntos.'}`
  const response = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN_2}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: { prompt, max_new_tokens: 900, temperature: 0.2 } }),
  })
  if (!response.ok) return NextResponse.json({ error: 'Replicate no pudo iniciar el análisis.' }, { status: 502 })
  const prediction = await response.json() as { id?: string; status?: string; output?: string[] | string; urls?: { get?: string } }
  let current = prediction
  for (let attempt = 0; attempt < 30 && current.status !== 'succeeded'; attempt++) {
    if (current.status === 'failed' || current.status === 'canceled') break
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const poll = current.urls?.get || (current.id ? `https://api.replicate.com/v1/predictions/${current.id}` : '')
    if (!poll) break
    const result = await fetch(poll, { headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN_2}` } })
    if (!result.ok) break
    current = await result.json()
  }
  if (current.status !== 'succeeded') return NextResponse.json({ error: 'El análisis no terminó correctamente.' }, { status: 502 })
  const output = Array.isArray(current.output) ? current.output.join('') : current.output || ''
  return NextResponse.json({ ok: true, model: MODEL, answer: output })
}
