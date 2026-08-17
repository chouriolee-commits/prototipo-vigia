import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('vigia_token')?.value

  if (!token) {
    return NextResponse.json({ detail: 'No autenticado' }, { status: 401 })
  }

  const resp = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!resp.ok) {
    cookieStore.delete('vigia_token')
    return NextResponse.json({ detail: 'Sesión inválida' }, { status: 401 })
  }

  const data = await resp.json()
  return NextResponse.json(data)
}