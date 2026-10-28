'use client'

import { useState } from 'react'
import HcuUniverse from '@/app/hcu/hcu-universe'

export default function ResearchHcu() {
  const [open, setOpen] = useState(true)
  return (
    <section className="research-hcu-shell section-wrap" aria-labelledby="research-hcu-title">
      <div className="research-hcu-heading">
        <div>
          <p className="eyebrow">MAPA TRANSFORMACIONAL · HCU</p>
          <h2 id="research-hcu-title">Lee cada fuente dentro de su contexto sistémico.</h2>
          <p>Expande el universo para recorrer dominios, riesgos, evidencia y relaciones. Reduce la capa cuando quieras volver al catálogo documental.</p>
        </div>
        <button type="button" className="button button-ghost" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="research-hcu-canvas">
          {open ? 'Reducir universo' : 'Ampliar universo'}
        </button>
      </div>
      <div id="research-hcu-canvas" className={open ? 'research-hcu-canvas is-open' : 'research-hcu-canvas is-collapsed'}>
        {open && <HcuUniverse initialQuery="transformación" />}
      </div>
    </section>
  )
}
