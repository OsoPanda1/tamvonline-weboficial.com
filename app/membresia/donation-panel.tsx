'use client'

import { useState } from 'react'
import { ArrowRight, HeartHandshake } from 'lucide-react'

const options = [5000, 20000, 50000, 100000]
const format = (cents: number) => `$${(cents / 100).toLocaleString('es-MX')}`

export default function DonationPanel() {
  const [amount, setAmount] = useState(5000)
  const [custom, setCustom] = useState('')
  const selected = custom ? Math.round(Number(custom) * 100) : amount
  const valid = Number.isInteger(selected) && selected >= 5000 && selected <= 10000000

  return (
    <section className="donation-panel" aria-labelledby="donation-title">
      <div className="donation-copy">
        <p className="eyebrow">APOYO VOLUNTARIO · SIN SUSCRIPCIÓN</p>
        <h2 id="donation-title">El conocimiento también necesita infraestructura.</h2>
        <p>Una donación sostiene documentación, investigación abierta y espacios de comunidad. Puedes apoyar una vez, sin cambiar tu nivel de acceso.</p>
      </div>
      <div className="donation-controls">
        <div className="donation-options" role="group" aria-label="Cantidad de donación">
          {options.map((value) => <button type="button" key={value} className={selected === value && !custom ? 'donation-option is-selected' : 'donation-option'} onClick={() => { setAmount(value); setCustom('') }}>{format(value)}</button>)}
        </div>
        <label className="donation-custom">Otra cantidad (mínimo $1,001 MXN)
          <span><b>$</b><input inputMode="numeric" value={custom} onChange={(event) => setCustom(event.target.value.replace(/[^0-9]/g, ''))} placeholder="1001" aria-label="Otra cantidad en pesos mexicanos" /></span>
        </label>
        <a className={`button button-primary ${!valid ? 'is-disabled' : ''}`} href={valid ? `/api/donaciones?amount=${selected}` : '#donation-title'} aria-disabled={!valid} onClick={(event) => { if (!valid) event.preventDefault() }}>
          Apoyar con {valid ? format(selected) : '$50'} <ArrowRight aria-hidden="true" />
        </a>
        <p className="donation-note"><HeartHandshake aria-hidden="true" /> Pago único seguro mediante Stripe. La donación no crea una membresía.</p>
      </div>
    </section>
  )
}
