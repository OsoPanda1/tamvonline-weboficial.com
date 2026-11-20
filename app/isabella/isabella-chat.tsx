'use client'

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { ArrowUp, BrainCircuit, CircleAlert, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'

type Message = { id: string; role: 'user' | 'assistant'; content: string }
type Lens = 'general' | 'territorial' | 'epistemic' | 'security' | 'governance'

const lensLabels: Record<Lens, string> = {
  general: 'General',
  territorial: 'Territorial',
  epistemic: 'Epistémica',
  security: 'Seguridad defensiva',
  governance: 'Gobernanza',
}

const suggestions = [
  '¿Cómo puede TAMV documentar una investigación con trazabilidad?',
  'Ayúdame a separar evidencia, inferencias e incertidumbres.',
  '¿Qué debería incluir una revisión responsable de un sistema de IA?',
]

export default function IsabellaChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [lens, setLens] = useState<Lens>('general')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length === 0 && !busy) return
    const messageList = endRef.current?.parentElement
    if (messageList) messageList.scrollTop = messageList.scrollHeight
  }, [messages.length, busy])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || busy) return
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content }
    const nextMessages = [...messages, userMessage].slice(-20)
    setMessages(nextMessages)
    setDraft('')
    setBusy(true)
    setError('')
    setNotice('Isabella está preparando una respuesta…')

    try {
      const response = await fetch('/api/isabella/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.map(({ role, content: text }) => ({ role, content: text })), lens }),
      })
      const data = (await response.json()) as { answer?: string; error?: string }
      if (!response.ok) throw new Error(data.error || 'No se pudo completar la conversación.')
      const assistantMessage: Message = { id: crypto.randomUUID(), role: 'assistant', content: data.answer || 'No se recibió una respuesta.' }
      setMessages((current) => [...current, assistantMessage].slice(-20))
      setNotice('Respuesta generada por AI Gateway. Sin memoria entre sesiones.')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'No se pudo completar la conversación.'
      setError(message)
      setNotice('La pregunta sigue en la conversación. Puedes reintentarla.')
    } finally {
      setBusy(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  function retryLastMessage() {
    const lastUser = [...messages].reverse().find((message) => message.role === 'user')
    if (!lastUser || busy) return
    setMessages((current) => current.filter((message) => message.id !== lastUser.id))
    setDraft(lastUser.content)
    setError('')
  }

  function clearConversation() {
    if (busy) return
    setMessages([])
    setError('')
    setNotice('La conversación se limpió. El historial no se guarda en el servidor.')
  }

  return (
    <section className="isabella-workspace section-wrap" aria-label="Sala de conversación de Isabella">
      <div className="isabella-chat-panel">
        <div className="isabella-chat-topbar">
          <div className="isabella-presence"><span className="isabella-presence-mark"><BrainCircuit aria-hidden="true" /></span><span><strong>ISABELLA</strong><small>ASISTENTE DE TEXTO · TAMV</small></span></div>
          <div className="isabella-top-actions"><span className="isabella-model-badge"><span aria-hidden="true" /> Gemini · AI Gateway</span><button className="isabella-clear-button" type="button" onClick={clearConversation} disabled={busy} aria-label="Limpiar conversación"><RotateCcw aria-hidden="true" /><span>Limpiar</span></button></div>
        </div>

        <div className="isabella-message-list" role="log" aria-live="polite" aria-relevant="additions text" aria-label="Mensajes de la conversación">
          {messages.length === 0 ? (
            <div className="isabella-welcome">
              <div className="isabella-welcome-icon"><Sparkles aria-hidden="true" /></div>
              <p className="eyebrow">SALA DE COGNICIÓN · TAMV ONLINE NETWORK</p>
              <h2>Conocimiento con <em>contexto.</em></h2>
              <p>Conversa con Isabella sobre investigación, tecnología y memoria territorial. Sus respuestas son generadas por un modelo de lenguaje y no representan una decisión institucional.</p>
              <div className="isabella-suggestions" aria-label="Preguntas sugeridas">
                {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setDraft(suggestion)}>{suggestion}</button>)}
              </div>
            </div>
          ) : (
            messages.map((message) => <article className={`isabella-message isabella-message-${message.role}`} key={message.id}><span className="isabella-message-author">{message.role === 'user' ? 'TÚ' : 'ISABELLA'}</span><p>{message.content}</p></article>)
          )}
          {busy && <div className="isabella-typing" role="status"><span /><span /><span /> Isabella está pensando…</div>}
          {error && <div className="isabella-error" role="alert"><CircleAlert aria-hidden="true" /><span>{error}</span><button type="button" onClick={retryLastMessage}>Reintentar</button></div>}
          <div ref={endRef} />
        </div>

        <form className="isabella-composer" onSubmit={submit}>
          <label className="sr-only" htmlFor="isabella-message">Mensaje para Isabella</label>
          <textarea id="isabella-message" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} maxLength={2_000} rows={2} placeholder="Escribe tu pregunta…" disabled={busy} />
          <div className="isabella-composer-toolbar">
            <label className="isabella-lens-label" htmlFor="isabella-lens">Enfoque</label>
            <select id="isabella-lens" value={lens} onChange={(event) => setLens(event.target.value as Lens)} disabled={busy} aria-label="Enfoque de respuesta">
              {(Object.keys(lensLabels) as Lens[]).map((value) => <option value={value} key={value}>{lensLabels[value]}</option>)}
            </select>
            <span className="isabella-composer-hint">Enter envía · Shift+Enter nueva línea</span>
            <button className="isabella-send-button" type="submit" disabled={busy || !draft.trim()} aria-label="Enviar mensaje"><ArrowUp aria-hidden="true" /></button>
          </div>
        </form>
        <div className="isabella-chat-status" aria-live="polite"><span>{notice}</span><span>{messages.length}/20 mensajes</span></div>
      </div>

      <aside className="isabella-boundaries" aria-label="Privacidad y límites de Isabella"><ShieldCheck aria-hidden="true" /><p><strong>Alcance y privacidad</strong><span>La conversación se envía al modelo externo configurado en TAMV para generar respuestas. El historial vive solo en esta pestaña y no se conserva como memoria personal. Isabella no consulta herramientas privadas ni ejecuta acciones.</span></p></aside>
    </section>
  )
}
