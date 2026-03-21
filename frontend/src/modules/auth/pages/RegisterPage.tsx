import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
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
import type { UserRole } from '../types'

const roleOptions: Array<{ value: '' | UserRole; label: string }> = [
  { value: '', label: 'Sin rol explícito (default backend)' },
  { value: 'Owner', label: 'Owner' },
  { value: 'Mechanic', label: 'Mechanic' },
  { value: 'Receptionist', label: 'Receptionist' },
]

export function RegisterPage() {
  const { isAuthenticated, isRegistering, register } = useAuth()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'' | UserRole>('')
  const [workshopName, setWorkshopName] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role: role || undefined,
        workshopName: workshopName.trim() || undefined,
      })

      navigate('/', { replace: true })
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'No fue posible crear la cuenta.'
      setError(message)
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-10 dark:bg-gray-950">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Crear cuenta</CardTitle>
            <CardDescription>
              Registro básico para acceder a MotoCore.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="firstName"
                    className="text-sm font-medium text-gray-900 dark:text-gray-100"
                  >
                    Nombre
                  </label>
                  <Input
                    id="firstName"
                    required
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="lastName"
                    className="text-sm font-medium text-gray-900 dark:text-gray-100"
                  >
                    Apellido
                  </label>
                  <Input
                    id="lastName"
                    required
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="registerEmail"
                  className="text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  Correo
                </label>
                <Input
                  id="registerEmail"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="registerPassword"
                  className="text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  Contraseña
                </label>
                <Input
                  id="registerPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="role"
                  className="text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  Rol (opcional)
                </label>
                <select
                  id="role"
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50"
                  value={role}
                  onChange={(event) => setRole(event.target.value as '' | UserRole)}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value || 'default'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="workshopName"
                  className="text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  Nombre del taller (opcional)
                </label>
                <Input
                  id="workshopName"
                  value={workshopName}
                  onChange={(event) => setWorkshopName(event.target.value)}
                />
              </div>

              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Error de registro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button className="w-full" type="submit" disabled={isRegistering}>
                {isRegistering ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>

              <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="font-medium text-gray-900 underline dark:text-gray-100">
                  Inicia sesión
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
