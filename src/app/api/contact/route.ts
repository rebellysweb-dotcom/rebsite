import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, message } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'valid email is required' }, { status: 400 })
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 2000) {
      return NextResponse.json({ error: 'message is required (max 2000 chars)' }, { status: 400 })
    }

    const safeName = name.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const safeMessage = message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')

    await resend.emails.send({
      from: 'contact@rebellys.com',
      to: process.env.ADMIN_EMAIL ?? 'orders@rebellys.com',
      replyTo: email,
      subject: `New contact message from ${safeName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
