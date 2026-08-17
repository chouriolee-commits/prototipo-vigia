'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Radar,
  ShieldCheck,
  Signal,
  Sparkles,
} from 'lucide-react'

export function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false)

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
            <span className="visual-status"><i /> Sistema en línea</span>
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

            <form className="login-form" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="email">Correo electrónico</label>
              <div className="field-wrap">
                <Mail aria-hidden="true" />
                <input id="email" type="email" placeholder="nombre@empresa.com" autoComplete="email" />
              </div>

              <div className="label-row">
                <label htmlFor="password">Contraseña</label>
                <Link href="#recuperar">¿Olvidaste tu contraseña?</Link>
              </div>
              <div className="field-wrap">
                <LockKeyhole aria-hidden="true" />
                <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Ingresa tu contraseña" autoComplete="current-password" />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>

              <label className="remember-row">
                <input type="checkbox" />
                <span className="custom-check"><Check aria-hidden="true" /></span>
                Recordarme en este dispositivo
              </label>

              <button className="login-submit" type="submit">
                Iniciar sesión <ArrowRight aria-hidden="true" />
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
