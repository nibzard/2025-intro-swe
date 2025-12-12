'use client';

import Link from 'next/link';
import { useActionState, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { login } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SkriptaLogo } from '@/components/branding/skripta-logo';
import { LogIn, AlertCircle, Mail, CheckCircle } from 'lucide-react';
import { PasswordInput } from '@/components/auth/password-input';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="gradient"
      size="lg"
      className="w-full"
      disabled={pending}
    >
      {pending ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Prijavljivanje...
        </>
      ) : (
        <>
          <LogIn className="w-4 h-4" />
          Prijavi se
        </>
      )}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, undefined);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setShowSuccessMessage(true);
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Unesite valjanu email adresu');
    } else {
      setEmailError('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4">
      <Card className="w-full max-w-md shadow-xl animate-slide-up border-gray-200 dark:border-gray-700">
        <CardHeader className="space-y-3 px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="flex justify-center">
            <SkriptaLogo size={64} />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-white">
            Dobrodošli natrag
          </CardTitle>
          <CardDescription className="text-center text-sm">
            Prijavite se na svoj račun
          </CardDescription>
        </CardHeader>

        <form action={formAction}>
          <CardContent className="space-y-4 px-4 sm:px-6">
            {showSuccessMessage && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 animate-slide-up">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                      Lozinka uspješno promijenjena!
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                      Sada se možete prijaviti s novom lozinkom.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSuccessMessage(false)}
                    className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    aria-label="Zatvori"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {state?.error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-slide-up">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email adresa
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ime.prezime@example.com"
                  className={`h-11 text-base pl-10 ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    validateEmail(e.target.value);
                  }}
                  onBlur={(e) => validateEmail(e.target.value)}
                  required
                  aria-invalid={emailError ? 'true' : 'false'}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
              </div>
              {emailError && (
                <p id="email-error" className="text-xs text-red-500 flex items-center gap-1 animate-slide-up">
                  <AlertCircle className="w-3 h-3" />
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Lozinka
                </Label>
                <Link
                  href="/auth/reset-password"
                  className="text-xs text-primary hover:underline"
                >
                  Zaboravili ste lozinku?
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••"
                className="h-11 text-base"
                autoComplete="current-password"
                required
                minLength={1}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="remember"
                name="remember"
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal cursor-pointer select-none"
              >
                Zapamti me
              </Label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 px-4 sm:px-6 pb-5 sm:pb-6">
            <SubmitButton />

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                  ili
                </span>
              </div>
            </div>

            <div className="text-sm text-center text-muted-foreground">
              Nemate račun?{' '}
              <Link
                href="/auth/register"
                className="text-primary hover:underline font-medium"
              >
                Registrirajte se besplatno
              </Link>
            </div>

            <div className="text-center">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                <span>←</span> Natrag na početnu
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
