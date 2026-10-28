import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getMembership } from '@/lib/products'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const productId = new URL(request.url).searchParams.get('product') || ''
  const product = getMembership(productId)
  if (!product) return NextResponse.json({ error: 'Membresía no encontrada.' }, { status: 404 })

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return NextResponse.json({ error: 'Stripe no está configurado en este entorno.' }, { status: 503 })

  const stripe = new Stripe(secretKey)
  const origin = new URL(request.url).origin
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price_data: { currency: 'mxn', product_data: { name: `TAMV ${product.name}`, description: product.description }, unit_amount: product.priceInCents, recurring: { interval: 'month' } }, quantity: 1 }],
    success_url: `${origin}/membresia?estado=exito&plan=${product.id}`,
    cancel_url: `${origin}/membresia?estado=cancelado`,
    metadata: { membership: product.id },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    integration_identifier: `tamv_membership_${Math.random().toString(36).slice(2, 10)}`,
    })
  } catch {
    return NextResponse.json({ error: 'No fue posible iniciar el checkout de Stripe.' }, { status: 502 })
  }
  if (!session.url) return NextResponse.json({ error: 'Stripe no devolvió una URL de checkout.' }, { status: 502 })
  return NextResponse.redirect(session.url, 303)
}
