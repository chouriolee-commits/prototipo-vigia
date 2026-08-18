'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Radar,
  ShieldCheck,
  Signal,
  Sparkles,
} from 'lucide-react'
import { login } from '@/lib/api'

export function LoginScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      const next = searchParams.get('next')
      router.replace(next && next.startsWith('/') ? next : '/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-ambient login-ambient-one" aria-hidden="true" />
      <div className="login-ambient login-ambient-two" aria-hidden="true" />

      <div className="login-shell">
        <section className="login-visual" aria-label="Monitoreo de ganado con VIGÍA">
          <div className="visual-grid" aria-hidden="true" />
          <div className="visual-topbar">
            <Link href="/" className="brand-lockup" aria-label="VIGÍA inicio">
              <span className="brand-mark"><Radar aria-hidden="true" /></span>
              <span>
                <strong>VIGÍA</strong>
                <small>Monitoreo Inteligente</small>
              </span>
            </Link>
          </div>

          <div className="visual-copy">
            <span className="eyebrow"><Sparkles aria-hidden="true" /> Inteligencia que protege</span>
            <h1>Una nueva perspectiva para cuidar tu ganado.</h1>
            <p>Visión aérea, detección en tiempo real y datos claros para decisiones más seguras.</p>
          </div>

          <div className="pasture-frame">
            <Image
              src="/drone-pasture-frame.png"
              alt="Vista aérea de ganado en un potrero"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 54vw"
              className="pasture-image"
            />
            <div className="pasture-shade" aria-hidden="true" />
            <div className="scan-cone" aria-hidden="true" />
            <div className="scan-ring scan-ring-one" aria-hidden="true" />
            <div className="scan-ring scan-ring-two" aria-hidden="true" />

            <div className="drone" aria-label="Drone de monitoreo en vuelo">
              <span className="drone-arm drone-arm-left" />
              <span className="drone-arm drone-arm-right" />
              <span className="drone-prop drone-prop-left" />
              <span className="drone-prop drone-prop-right" />
              <span className="drone-core"><Radar aria-hidden="true" /></span>
              <span className="drone-light" />
            </div>

            <div className="telemetry telemetry-drone">
              <span className="telemetry-icon"><Signal aria-hidden="true" /></span>
              <span><b>DRONE-01</b><small>En vuelo · 42 m</small></span>
            </div>
            <div className="telemetry telemetry-ai"><i /><span>AI MONITORING</span></div>
            <div className="animal-tag animal-tag-one"><b>Animal #024</b><span><i /> 94% detectado</span></div>
            <div className="animal-tag animal-tag-two"><b>Animal #087</b><span><i /> 98% detectado</span></div>
            <div className="zone-label"><span>Zona Norte</span><small>7.2421° N · 73.1182° W</small></div>
          </div>

          <div className="visual-footer">
            <span><ShieldCheck aria-hidden="true" /> Datos protegidos</span>
            <span>© {new Date().getFullYear()} VIGÍA</span>
          </div>
        </section>

        <section className="login-form-panel" aria-label="Iniciar sesión">
          <div className="mobile-brand brand-lockup">
            <span className="brand-mark"><Radar aria-hidden="true" /></span>
            <span><strong>VIGÍA</strong><small>Monitoreo Inteligente</small></span>
          </div>

          <div className="form-wrap">
            <div className="form-heading">
              <span className="form-kicker">ACCESO SEGURO</span>
              <h2>Bienvenido a VIGÍA</h2>
              <p>Ingresa para acceder al sistema de monitoreo.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="email">Correo electrónico</label>
              <div className="field-wrap">
                <Mail aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="label-row">
                <label htmlFor="password">Contraseña</label>
                <Link href="#recuperar">¿Olvidaste tu contraseña?</Link>
              </div>
              <div className="field-wrap">
                <LockKeyhole aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>

              <label className="remember-row">
                <input type="checkbox" />
                <span className="custom-check"><Check aria-hidden="true" /></span>
                Recordarme en este dispositivo
              </label>

              {error && (
                <p className="login-error" role="alert">
                  {error}
                </p>
              )}

              <button className="login-submit" type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                    Verificando…
                  </>
                ) : (
                  <>
                    Iniciar sesión <ArrowRight aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="login-divider"><span>o continúa con</span></div>
            <button type="button" className="sso-button">
              <span className="google-mark"><i /><i /><i /><i /></span>
              Iniciar con Google
            </button>

            <p className="help-copy">¿Necesitas ayuda? <Link href="mailto:soporte@vigia.co">Contacta a soporte</Link></p>
          </div>

          <p className="secure-connection"><LockKeyhole aria-hidden="true" /> Conexión segura y cifrada</p>
        </section>
      </div>
    </main>
  )
}
