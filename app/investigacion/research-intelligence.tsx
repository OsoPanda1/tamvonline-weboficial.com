'use client'
import { FormEvent, useState } from 'react'
import { BrainCircuit, Search, Sparkles } from 'lucide-react'

type Hit = { objectID?: string; title?: string; url?: string; source?: string; year?: string | number; type?: string; summary?: string }

export default function ResearchIntelligence() {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault(); if (query.trim().length < 3) return
    setBusy(true); setMessage('Consultando índice y preparando lectura sistémica…'); setAnswer('')
    try {
      const search = await fetch('/api/search', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query }) })
      const searchData = await search.json() as { hits?: Hit[] }
      const nextHits = searchData.hits || []; setHits(nextHits)
      const context = nextHits.map((hit) => [hit.title, hit.source, hit.year, hit.summary].filter(Boolean).join(' · ')).join('\n')
      const intelligence = await fetch('/api/research/intelligence', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query, context }) })
      const intelligenceData = await intelligence.json() as { answer?: string; error?: string }
      if (!intelligence.ok) throw new Error(intelligenceData.error || 'No se pudo completar el análisis.')
      setAnswer(intelligenceData.answer || 'No se recibió una lectura.')
      setMessage(`${nextHits.length} señales documentales conectadas con Replicate.`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo completar la consulta.') } finally { setBusy(false) }
  }
  return <section className="research-intelligence section-wrap" aria-labelledby="research-intelligence-title"><div className="research-intelligence-heading"><div><p className="eyebrow">CAPA DE INTELIGENCIA · ALGOLIA + REPLICATE</p><h2 id="research-intelligence-title">Del hallazgo a la lectura sistémica.</h2><p>Busca señales en el índice documental y solicita una síntesis trazable. La IA propone relaciones; la fuente original conserva la autoridad.</p></div><BrainCircuit aria-hidden="true" /></div><form className="research-intelligence-form" onSubmit={submit}><label className="sr-only" htmlFor="research-question">Pregunta de investigación</label><input id="research-question" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. ¿Qué riesgos sistémicos aparecen en soberanía digital?" /><button className="button button-primary" disabled={busy || query.trim().length < 3} type="submit">{busy ? 'Analizando…' : <><Search aria-hidden="true" />Investigar</>}</button></form>{message&&<p className="research-intelligence-status" aria-live="polite">{message}</p>}<div className="research-intelligence-grid">{hits.length>0&&<div className="research-signal-list"><p className="eyebrow">SEÑALES DEL ÍNDICE</p>{hits.map((hit)=><a className="research-signal" href={hit.url||'#'} target="_blank" rel="noopener noreferrer" key={hit.objectID||hit.title}><strong>{hit.title||'Registro sin título'}</strong><span>{[hit.source,hit.type,hit.year].filter(Boolean).join(' · ')}</span></a>)}</div>}{answer&&<article className="research-answer"><div className="research-answer-label"><Sparkles aria-hidden="true" />Lectura de Replicate</div><div className="research-answer-body">{answer}</div></article>}</div></section>
}
