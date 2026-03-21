import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { useAuth } from '../hooks/useAuth'

type LocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const { isAuthenticated, isLoggingIn, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      await login(email.trim(), password)
      const nextPath = (location.state as LocationState | null)?.from?.pathname ?? '/'
      navigate(nextPath, { replace: true })
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'No fue posible iniciar sesión.'
      setError(message)
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-10 dark:bg-gray-950">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>
              Accede a MotoCore con tu correo y contraseña.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  Correo
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Error de autenticación</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button className="w-full" type="submit" disabled={isLoggingIn}>
                {isLoggingIn ? 'Ingresando...' : 'Ingresar'}
              </Button>

              <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="font-medium text-gray-900 underline dark:text-gray-100">
                  Regístrate
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
