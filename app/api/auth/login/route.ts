import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function POST(request: Request) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: 'JSON inválido' }, { status: 400 })
  }

  const email = body.email?.trim()
  const password = body.password

  if (!email || !password) {
    return NextResponse.json(
      { detail: 'Correo y contraseña son obligatorios' },
      { status: 400 },
    )
  }

  const resp = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  })

  const data = await resp.json()

  if (!resp.ok) {
    return NextResponse.json(
      { detail: data.detail ?? 'Credenciales incorrectas' },
      { status: resp.status },
    )
  }

  const cookieStore = await cookies()
  cookieStore.set({
    name: 'vigia_token',
    value: data.access_token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: data.expires_in,
  })

  return NextResponse.json({ email: data.email, token_type: data.token_type })
}