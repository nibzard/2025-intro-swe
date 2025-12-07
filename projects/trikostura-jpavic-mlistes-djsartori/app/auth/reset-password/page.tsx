'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SkriptaLogo } from '@/components/branding/skripta-logo';
import { Mail, CheckCircle, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { resetPassword } from '@/app/auth/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="gradient"
      size="lg"
      className="w-full h-11 text-base font-semibold"
      disabled={pending}
    >
      {pending ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Slanje...
        </>
      ) : (
        <>
          <KeyRound className="w-4 h-4" />
          Pošalji link za resetiranje
        </>
      )}
    </Button>
  );
}

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(resetPassword, undefined);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState(false);

  const validateEmail = (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Unesite valjanu email adresu');
    } else {
      setEmailError('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (touched) {
      validateEmail(value);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validateEmail(email);
  };

  if (state?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4">
        <Card className="w-full max-w-md shadow-xl animate-slide-up border-gray-200 dark:border-gray-700">
          <CardHeader className="text-center space-y-4 px-4 sm:px-6 pt-6 sm:pt-8">
            <div className="flex justify-center">
              <SkriptaLogo size={64} />
            </div>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur opacity-25 animate-pulse" />
              <div className="relative bg-green-100 dark:bg-green-900/30 rounded-full p-4 inline-block">
                <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Email poslan!
            </CardTitle>
            <CardDescription className="text-sm px-2">
              Ako postoji račun s tom email adresom, poslali smo vam kod za resetiranje lozinke.
            </CardDescription>
            <CardDescription className="text-xs text-muted-foreground px-2">
              Provjerite svoju email sandučić (i spam folder). Kod vrijedi 15 minuta.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-4 px-4 sm:px-6 pb-5 sm:pb-6">
            <Link href="/auth/reset-password/verify" className="w-full">
              <Button variant="gradient" size="lg" className="w-full">
                <KeyRound className="w-4 h-4" />
                Unesite kod za resetiranje
              </Button>
            </Link>
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Natrag na prijavu
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4">
      <Card className="w-full max-w-md shadow-xl animate-slide-up border-gray-200 dark:border-gray-700">
        <CardHeader className="space-y-3 px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="flex justify-center">
            <SkriptaLogo size={64} />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-white">
            Resetiraj lozinku
          </CardTitle>
          <CardDescription className="text-center text-sm">
            Unesite svoju email adresu i poslat ćemo vam link za resetiranje lozinke.
          </CardDescription>
        </CardHeader>

        <form action={formAction}>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            {state?.error && (
              <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 animate-slide-up">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {state.error}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email adresa
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ime.prezime@example.com"
                  className={`h-11 text-base pl-10 ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  aria-invalid={emailError ? 'true' : 'false'}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
              </div>
              {emailError && touched && (
                <p id="email-error" className="text-xs text-red-500 flex items-center gap-1 animate-slide-up">
                  <AlertCircle className="w-3 h-3" />
                  {emailError}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Unesite email adresu povezanu s vašim računom
              </p>
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
              Sjetili ste se lozinke?{' '}
              <Link
                href="/auth/login"
                className="text-primary hover:underline font-medium"
              >
                Prijavite se
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
