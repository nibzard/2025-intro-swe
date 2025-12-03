'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { register } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Registracija...' : 'Registriraj se'}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useActionState(register, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Registracija
          </CardTitle>
          <CardDescription className="text-center">
            Pridruži se zajednici studenata
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className={`p-3 text-sm ${
                (state as any)?.success
                  ? 'text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              } rounded-md`}>
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ime.prezime@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Korisničko ime</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="korisnik123"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Puno ime</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Ime Prezime"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Lozinka</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potvrdi lozinku</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <SubmitButton />

            <div className="text-sm text-center text-muted-foreground">
              Već imaš račun?{' '}
              <Link
                href="/auth/login"
                className="text-primary hover:underline font-medium"
              >
                Prijavi se
              </Link>
            </div>

            <div className="text-center">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                ← Nazad na početnu
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
