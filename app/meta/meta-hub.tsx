'use client'

import { FormEvent, useState } from 'react'
import {
  ArrowRight, ArrowUpRight, BookOpen, Check, CircleHelp, Compass, ExternalLink,
  FileSearch, Globe2, Layers3, MessageCircle, Search, Sparkles, Users,
} from 'lucide-react'

type ResearchItem = {
  id: string
  provider: string
  title: string
  url: string
  doi: string | null
  year: number | null
  authors: string[]
  venue: string | null
  resourceType: string | null
  citedByCount: number | null
  license: string | null
  openAccess: boolean | null
  evidenceClass: string
}
type ProviderState = { id: string; name: string; status: 'ok' | 'empty' | 'unavailable'; count: number; note?: string }
type SearchResponse = {
  ok?: boolean
  error?: string
  query?: string
  results?: ResearchItem[]
  providers?: ProviderState[]
  sourceLinks?: Record<string, string>
  methodology?: string
}

const quickPrompts = [
  'IA responsable y gobernanza',
  'memoria territorial latinoamericana',
  'ciencia abierta y repositorios',
]

const sourceCards = [
  { key: 'zenodo', name: 'Zenodo', kind: 'Repositorio abierto', icon: BookOpen },
  { key: 'figshare', name: 'Figshare', kind: 'Datos y publicaciones', icon: Layers3 },
  { key: 'osf', name: 'OSF', kind: 'Proyectos y preregistros', icon: Compass },
  { key: 'frontiers', name: 'Frontiers', kind: 'Editorial científica', icon: BookOpen },
  { key: 'worldEconomicForum', name: 'World Economic Forum', kind: 'Informes y perspectivas', icon: Globe2 },
  { key: 'researchGate', name: 'ResearchGate', kind: 'Perfiles y publicaciones', icon: Users },
  { key: 'neonForum', name: 'Neon Forum', kind: 'Comunidad de desarrollo', icon: MessageCircle },
  { key: 'openAiForum', name: 'OpenAI Community', kind: 'Comunidad de IA', icon: MessageCircle },
  { key: 'googleDevelopers', name: 'Google Developers', kind: 'Foros técnicos', icon: MessageCircle },
]

const statusLabel: Record<ProviderState['status'], string> = {
  ok: 'Conectada',
  empty: 'Sin coincidencias',
  unavailable: 'No disponible',
}

const sourceSearchUrls: Record<string, (query: string) => string> = {
  zenodo: (query) => `https://zenodo.org/search?q=${encodeURIComponent(query)}`,
  figshare: (query) => `https://figshare.com/search?q=${encodeURIComponent(query)}`,
  osf: (query) => `https://osf.io/search/?q=${encodeURIComponent(query)}`,
  frontiers: (query) => `https://www.frontiersin.org/search?query=${encodeURIComponent(query)}`,
  worldEconomicForum: (query) => `https://www.weforum.org/search/?query=${encodeURIComponent(query)}`,
  researchGate: (query) => `https://www.researchgate.net/search/publication?q=${encodeURIComponent(query)}`,
  neonForum: (query) => `https://community.neon.tech/search?q=${encodeURIComponent(query)}`,
  openAiForum: (query) => `https://community.openai.com/search?q=${encodeURIComponent(query)}`,
  googleDevelopers: (query) => `https://discuss.google.dev/search?q=${encodeURIComponent(query)}`,
}

export default function MetaHub() {
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<SearchResponse | null>(null)
  const [providerFilter, setProviderFilter] = useState('Todas las fuentes')

  async function runSearch(value: string) {
    const normalized = value.trim()
    if (normalized.length < 3) {
      setError('Escribe al menos tres caracteres para iniciar la búsqueda.')
      return
    }
    setQuery(normalized)
    setActiveQuery(normalized)
    setLoading(true)
    setError('')
    setProviderFilter('Todas las fuentes')
    try {
      const response = await fetch('/api/research/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: normalized, type: 'research' }),
        cache: 'no-store',
      })
      const payload = (await response.json()) as SearchResponse
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'No fue posible completar la búsqueda.')
      setData(payload)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible completar la búsqueda.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void runSearch(query)
  }

  const results = data?.results || []
  const visibleResults = providerFilter === 'Todas las fuentes'
    ? results
    : results.filter((result) => result.provider === providerFilter)

  return (
    <div className="meta-app section-wrap">
      <aside className="meta-rail" aria-label="Navegación de TAMV Meta">
        <div className="meta-rail-brand"><span className="meta-brand-mark">T</span><span><strong>TAMV META</strong><small>LOUNGE DE CONOCIMIENTO</small></span></div>
        <p className="meta-rail-label">TU ESPACIO</p>
        <a className="meta-rail-link active" href="#meta-discover"><Compass aria-hidden="true" /> Descubrir</a>
        <a className="meta-rail-link" href="#meta-results"><FileSearch aria-hidden="true" /> Explorar evidencia</a>
        <a className="meta-rail-link" href="#meta-communities"><MessageCircle aria-hidden="true" /> Comunidades</a>
        <a className="meta-rail-link" href="/miembros"><Users aria-hidden="true" /> Red TAMV <ArrowUpRight aria-hidden="true" /></a>
        <div className="meta-rail-note"><Sparkles aria-hidden="true" /><p><strong>Un espacio compartido</strong><span>Ideas, fuentes y conversaciones conectadas con trazabilidad.</span></p></div>
      </aside>

      <div className="meta-main">
        <section className="meta-welcome" id="meta-discover">
          <div className="meta-welcome-top"><span className="meta-live-dot" /> INVESTIGACIÓN ABIERTA · TAMV ONLINE NETWORK <span className="meta-version">META / 01</span></div>
          <p className="eyebrow"><span className="eyebrow-line" /> INVESTIGAR · CONECTAR · CONSTRUIR</p>
          <h1>El conocimiento avanza <em>en comunidad.</em></h1>
          <p className="meta-intro">Un lounge para descubrir publicaciones, datos, proyectos y conversaciones. Busca en fuentes abiertas desde un mismo lugar, con el origen y los límites de cada registro a la vista.</p>
          <form className="meta-search" onSubmit={submit} role="search">
            <Search aria-hidden="true" />
            <label className="sr-only" htmlFor="meta-query">Buscar en investigación abierta</label>
            <input id="meta-query" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={180} placeholder="¿Qué te gustaría explorar hoy?" />
            <button type="submit" disabled={loading}>{loading ? 'Buscando…' : 'Buscar'} <ArrowRight aria-hidden="true" /></button>
          </form>
          <div className="meta-prompt-row"><span>IDEAS PARA EMPEZAR</span>{quickPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => void runSearch(prompt)}>{prompt}</button>)}</div>
        </section>

        <section className="meta-feature-row" aria-label="Capacidades del espacio">
          <article><span className="meta-feature-icon"><Globe2 aria-hidden="true" /></span><div><strong>Búsqueda federada</strong><p>8 índices abiertos por consulta</p></div></article>
          <article><span className="meta-feature-icon"><FileSearch aria-hidden="true" /></span><div><strong>Procedencia visible</strong><p>Fuente, DOI y tipo de registro</p></div></article>
          <article><span className="meta-feature-icon"><CircleHelp aria-hidden="true" /></span><div><strong>Rigor contextual</strong><p>Un registro no equivale a validación</p></div></article>
        </section>

        <section className="meta-results-section" id="meta-results" aria-live="polite">
          <div className="meta-section-heading"><div><p className="eyebrow">EL CONOCIMIENTO, EN CONTEXTO</p><h2>{activeQuery ? `Resultados para “${activeQuery}”` : 'Una red de ideas para explorar'}</h2></div>{data && <span className="meta-result-count">{results.length} registros</span>}</div>
          {error && <div className="meta-alert" role="alert">{error}</div>}
          {loading && <div className="meta-loading" role="status"><span className="meta-spinner" /> Consultando fuentes públicas; algunas pueden tardar o no responder.</div>}

          {data && !loading && <>
            <div className="meta-source-status" aria-label="Estado de fuentes consultadas">{(data.providers || []).map((provider) => <span key={provider.id} className={`meta-source-status-item meta-status-${provider.status}`} title={provider.note}><i aria-hidden="true" />{provider.name} <small>{statusLabel[provider.status]}</small></span>)}</div>
            <div className="meta-results-toolbar"><span>{visibleResults.length} de {results.length} resultados · metadatos consultados en vivo</span><label>Filtrar por fuente <select value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}><option>Todas las fuentes</option>{(data.providers || []).map((provider) => <option key={provider.id}>{provider.name}</option>)}</select></label></div>
            {visibleResults.length ? <div className="meta-result-list">{visibleResults.map((result, index) => <article className="meta-result-card" key={`${result.provider}-${result.id}`}>
              <div className="meta-result-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="meta-result-content"><div className="meta-result-kicker"><span>{result.provider}</span>{result.resourceType && <span>{result.resourceType}</span>}{result.openAccess === true && <span className="meta-open-badge"><Check aria-hidden="true" /> Acceso abierto</span>}</div>
                <h3><a href={result.url} target="_blank" rel="noopener noreferrer">{result.title}<ExternalLink aria-hidden="true" /></a></h3>
                <div className="meta-result-meta">{result.authors.length > 0 && <span>{result.authors.slice(0, 4).join(', ')}{result.authors.length > 4 ? ' y más' : ''}</span>}{result.year && <span>{result.year}</span>}{result.venue && <span>{result.venue}</span>}{result.doi && <span>DOI: {result.doi}</span>}</div>
                <p className="meta-evidence-note">{result.evidenceClass}</p>
              </div>
              <a className="meta-result-open" href={result.url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${result.title}`}><ArrowUpRight aria-hidden="true" /></a>
            </article>)}</div> : <div className="meta-empty"><FileSearch aria-hidden="true" /><strong>No encontramos registros en esta fuente</strong><span>Prueba otra fuente o una consulta más amplia.</span></div>}
            <p className="meta-methodology">{data.methodology}</p>
          </>}

          {!data && !loading && <div className="meta-empty meta-empty-welcome"><div className="meta-empty-orbit"><Sparkles aria-hidden="true" /></div><strong>Tu próxima pregunta puede abrir una nueva ruta.</strong><span>Los resultados aparecerán aquí con enlaces a su registro original y notas para interpretar cada fuente.</span></div>}
        </section>

        <section className="meta-communities" id="meta-communities">
          <div className="meta-section-heading"><div><p className="eyebrow">MÁS ALLÁ DE LAS PUBLICACIONES</p><h2>Comunidades y voces expertas</h2></div><p>Explora las conversaciones y perspectivas directamente en sus plataformas originales.</p></div>
          <div className="meta-community-grid">{sourceCards.map(({ key, name, kind, icon: Icon }) => {
            const href = data?.sourceLinks?.[key] || sourceSearchUrls[key](activeQuery || query)
            return <a className="meta-community-card" key={key} href={href} target="_blank" rel="noopener noreferrer">
              <span className="meta-community-icon"><Icon aria-hidden="true" /></span><span className="meta-community-copy"><strong>{name}</strong><small>{kind}</small></span><ArrowUpRight aria-hidden="true" />
            </a>
          })}</div>
          <p className="meta-community-note">Las fuentes sin API pública compatible aparecen como enlaces de búsqueda directa; TAMV no copia ni reindexa sus conversaciones.</p>
        </section>

        <section className="meta-next-steps"><div><span className="meta-next-icon"><Sparkles aria-hidden="true" /></span><div><p className="eyebrow">LA RED TAMV</p><h2>De descubrir a colaborar.</h2><p>Conecta una investigación con perfiles, proyectos, recursos e Isabella Villaseñor AI. La conversación con Isabella es experimental y no sustituye revisión humana.</p></div></div><div className="meta-next-links"><a href="/hcu">Abrir universo HCU <ArrowUpRight aria-hidden="true" /></a><a href="/isabella">Conversar con Isabella <ArrowUpRight aria-hidden="true" /></a><a href="/investigacion">Ver producción y trazabilidad <ArrowUpRight aria-hidden="true" /></a></div></section>
      </div>
    </div>
  )
}
