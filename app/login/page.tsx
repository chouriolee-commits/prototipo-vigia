import { Suspense } from 'react'
import { LoginScreen } from '@/components/login-screen'

export const metadata = {
  title: 'Iniciar sesión | VIGÍA',
  description: 'Accede a VIGÍA, monitoreo inteligente para ganado.',
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  )
}