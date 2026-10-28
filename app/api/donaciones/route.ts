import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

const PRESET_AMOUNTS = new Set([5000, 20000, 50000, 100000])

export async function GET(request: Request) {
  const amount = Number(new URL(request.url).searchParams.get('amount'))
  const isCustom = amount > 100000
  if (!Number.isInteger(amount) || amount <= 0 || (!PRESET_AMOUNTS.has(amount) && !isCustom) || amount > 10000000) {
    return NextResponse.json({ error: 'Selecciona una donación válida entre $50 y $100,000 MXN.' }, { status: 400 })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return NextResponse.json({ error: 'Stripe no está configurado en este entorno.' }, { status: 503 })

  const stripe = new Stripe(secretKey)
  const origin = new URL(request.url).origin
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'mxn', product_data: { name: 'Donación TAMV Online Network', description: 'Apoyo voluntario a infraestructura, investigación y conocimiento abierto.' }, unit_amount: amount }, quantity: 1 }],
      success_url: `${origin}/membresia?estado=donacion-exitosa`,
      cancel_url: `${origin}/membresia?estado=donacion-cancelada`,
      customer_creation: 'always',
      metadata: { contribution_type: 'donation', amount_mxn: String(amount / 100) },
      integration_identifier: `tamv_donation_${Math.random().toString(36).slice(2, 10)}`,
    })
    if (!session.url) return NextResponse.json({ error: 'Stripe no devolvió una URL de checkout.' }, { status: 502 })
    return NextResponse.redirect(session.url, 303)
  } catch {
    return NextResponse.json({ error: 'No fue posible iniciar la donación.' }, { status: 502 })
  }
}
