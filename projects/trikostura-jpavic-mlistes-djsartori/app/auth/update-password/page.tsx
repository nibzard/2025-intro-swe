'use client';

import Link from 'next/link';
import { useFormState } from 'react-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SkriptaLogo } from '@/components/branding/skripta-logo';
import { Lock } from 'lucide-react';
import { updatePassword } from '@/app/auth/actions';

export default function UpdatePasswordPage() {
  const [state, formAction] = useFormState(updatePassword, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <SkriptaLogo size={60} />
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Skripta</h1>
          <p className="text-gray-600 dark:text-gray-400">Postavite novu lozinku</p>
        </div>

        <Card className="shadow-xl border-gray-200 dark:border-gray-700">
          <CardHeader className="space-y-1 px-4 sm:px-6 pt-5 sm:pt-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-center">
              Nova lozinka
            </CardTitle>
            <CardDescription className="text-center text-sm">
              Unesite novu lozinku za svoj račun
            </CardDescription>
          </CardHeader>

          <form action={formAction}>
            <CardContent className="space-y-4 px-4 sm:px-6">
              {state?.error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Nova lozinka
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 text-base"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Potvrdi lozinku
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 text-base"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 px-4 sm:px-6 pb-5 sm:pb-6">
              <Button type="submit" className="w-full h-11 text-base font-semibold" variant="gradient">
                Ažuriraj lozinku
              </Button>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <span>←</span> Natrag na prijavu
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>
            Zaštićeno sustavom Skripta 🇭🇷
          </p>
        </div>
      </div>
    </div>
  );
}
