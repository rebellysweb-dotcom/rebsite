import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { readJsonBody, isValidEmail, stripControl, escapeHtml } from '@/lib/http'
import { rateLimitIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

// Optional Cloudflare Turnstile. Skipped entirely when TURNSTILE_SECRET is unset.
// The client widget sends its token as `turnstileToken` (or `cf-turnstile-response`).
async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET
  if (!secret) return true
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return false
  try {
    const form = new URLSearchParams({ secret, response: token })
    if (ip !== 'dev-local') form.set('remoteip', ip)
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(5000),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    // Same durable limiter as /api/orders, keyed only on CF-Connecting-IP.
    if (!(await rateLimitIp(request, 'contact-min', { limit: 3, windowSec: 60 }))) {
      return bad('Too many requests', 429)
    }
    if (!(await rateLimitIp(request, 'contact-hour', { limit: 10, windowSec: 3600 }))) {
      return bad('Too many requests', 429)
    }

    const parsed = await readJsonBody(request, 16 * 1024)
    if (!parsed.ok) return parsed.response
    const { name, email, message } = parsed.body

    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      return bad('name is required')
    }
    if (typeof email !== 'string' || !isValidEmail(email.trim())) {
      return bad('valid email is required')
    }
    if (typeof message !== 'string' || message.trim().length === 0 || message.length > 2000) {
      return bad('message is required (max 2000 chars)')
    }

    const ip = request.headers.get('cf-connecting-ip')?.trim() || 'dev-local'
    const bodyRecord = parsed.body as Record<string, unknown>
    if (!(await verifyTurnstile(bodyRecord.turnstileToken ?? bodyRecord['cf-turnstile-response'], ip))) {
      return bad('Verification failed', 403)
    }

    const cleanName = stripControl(name)
    const cleanEmail = email.trim()
    const safeName = escapeHtml(cleanName)
    const safeEmail = escapeHtml(cleanEmail)
    const safeMessage = escapeHtml(message).replace(/\r?\n/g, '<br>')

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('Contact form: RESEND_API_KEY is not set')
      return bad('Failed to send message. Please try again.', 500)
    }
    const resend = new Resend(apiKey)

    const { error } = await resend.emails.send({
      from: 'contact@rebellys.com',
      to: process.env.ADMIN_EMAIL ?? 'orders@rebellys.com',
      replyTo: cleanEmail,
      subject: `New contact message from ${cleanName}`.slice(0, 150),
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
      `,
    })
    if (error) {
      console.error('Contact form: Resend error', error.name)
      return bad('Failed to send message. Please try again.', 500)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error instanceof Error ? error.message : 'unknown')
    return bad('Failed to send message. Please try again.', 500)
  }
}
