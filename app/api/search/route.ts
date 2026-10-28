import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!process.env.ALGOLIA_APP_ID || !process.env.ALGOLIA_SEARCH_API_KEY_2) return NextResponse.json({ hits: [], error: 'Algolia no está configurado.' }, { status: 503 })
  let body: { query?: unknown; index?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }) }
  const query = typeof body.query === 'string' ? body.query.trim().slice(0, 180) : ''
  const index = typeof body.index === 'string' && /^[a-zA-Z0-9_-]+$/.test(body.index) ? body.index : 'tamv_research'
  if (query.length < 2) return NextResponse.json({ hits: [] })
  const response = await fetch(`https://${process.env.ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${encodeURIComponent(index)}/query`, {
    method: 'POST', headers: { 'X-Algolia-Application-Id': process.env.ALGOLIA_APP_ID, 'X-Algolia-API-Key': process.env.ALGOLIA_SEARCH_API_KEY_2, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, hitsPerPage: 8, attributesToRetrieve: ['objectID', 'title', 'url', 'source', 'year', 'type', 'summary'] }),
  })
  if (!response.ok) return NextResponse.json({ hits: [], error: 'El índice Algolia no está disponible todavía.' }, { status: 502 })
  const data = await response.json()
  return NextResponse.json({ hits: Array.isArray(data.hits) ? data.hits : [], query })
}
