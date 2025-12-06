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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 px-4 sm:px-6 pt-5 sm:pt-6">
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">
            Registracija
          </CardTitle>
          <CardDescription className="text-center text-sm">
            Pridruži se zajednici studenata
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
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
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ime.prezime@example.com"
                className="h-11 text-base"
                autoComplete="email"
                inputMode="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm">Korisničko ime</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="korisnik123"
                className="h-11 text-base"
                autoComplete="username"
                pattern="[a-zA-Z][a-zA-Z0-9_-]{2,19}"
                minLength={3}
                maxLength={20}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                3-20 znakova, počinje slovom, samo slova, brojevi, _ i -
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm">Puno ime</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Ime Prezime"
                className="h-11 text-base"
                autoComplete="name"
                minLength={2}
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Unesite puno ime i prezime
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Lozinka</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="h-11 text-base"
                autoComplete="new-password"
                minLength={8}
                maxLength={100}
                required
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p className="font-medium">Lozinka mora sadržavati:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Najmanje 8 znakova</li>
                  <li>Bar jedno veliko slovo (A-Z)</li>
                  <li>Bar jedno malo slovo (a-z)</li>
                  <li>Bar jednu brojku (0-9)</li>
                  <li>Bar jedan poseban znak (!@#$%...)</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm">Potvrdi lozinku</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="h-11 text-base"
                autoComplete="new-password"
                minLength={8}
                maxLength={100}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 px-4 sm:px-6 pb-5 sm:pb-6">
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
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
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
