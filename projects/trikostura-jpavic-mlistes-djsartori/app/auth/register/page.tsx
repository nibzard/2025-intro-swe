'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { register } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SkriptaLogo } from '@/components/branding/skripta-logo';
import { UserPlus, AlertCircle, Mail, User, CheckCircle2 } from 'lucide-react';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator';
import { UsernameInput } from '@/components/auth/username-input';

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
          Registracija...
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Registriraj se
        </>
      )}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useActionState(register, undefined);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isUsernameValid, setIsUsernameValid] = useState(false);

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Unesite valjanu email adresu';
        } else {
          delete newErrors.email;
        }
        break;

      case 'full_name':
        if (value && value.trim().split(/\s+/).length < 2) {
          newErrors.full_name = 'Unesite ime i prezime';
        } else if (value && !/^[a-zA-ZčćžšđČĆŽŠĐ\s'-]+$/.test(value)) {
          newErrors.full_name = 'Samo slova, razmaci i znakovi \' i -';
        } else {
          delete newErrors.full_name;
        }
        break;

      case 'confirmPassword':
        if (value && value !== formData.password) {
          newErrors.confirmPassword = 'Lozinke se ne podudaraju';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const isSuccess = (state as any)?.success;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4">
      <Card className="w-full max-w-md shadow-xl animate-slide-up border-gray-200 dark:border-gray-700">
        <CardHeader className="space-y-3 px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="flex justify-center">
            <SkriptaLogo size={64} />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-white">
            Kreiraj račun
          </CardTitle>
          <CardDescription className="text-center text-sm">
            Pridruži se zajednici studenata
          </CardDescription>
        </CardHeader>

        <form action={formAction}>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            {state?.error && (
              <div className={`p-3 rounded-lg border animate-slide-up ${
                isSuccess
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-2">
                  {isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm ${
                    isSuccess
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
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
                  className={`h-11 text-base pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  autoComplete="email"
                  inputMode="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && touched.email && (
                <p id="email-error" className="text-xs text-red-500 flex items-center gap-1 animate-slide-up">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Koristite vašu službenu studentsku email adresu
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Korisničko ime
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400 z-10" />
                <div className="pl-10">
                  <UsernameInput
                    id="username"
                    name="username"
                    placeholder="korisnik123"
                    className="h-11 text-base pl-0"
                    autoComplete="username"
                    pattern="[a-zA-Z][a-zA-Z0-9_-]{2,19}"
                    minLength={3}
                    maxLength={20}
                    required
                    onValidationChange={setIsUsernameValid}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                3-20 znakova, počinje slovom, samo slova, brojevi, _ i -
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium">
                Puno ime
              </Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Ime Prezime"
                className={`h-11 text-base ${errors.full_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                autoComplete="name"
                minLength={2}
                maxLength={100}
                value={formData.full_name}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={errors.full_name ? 'true' : 'false'}
                aria-describedby={errors.full_name ? 'fullname-error' : undefined}
              />
              {errors.full_name && touched.full_name && (
                <p id="fullname-error" className="text-xs text-red-500 flex items-center gap-1 animate-slide-up">
                  <AlertCircle className="w-3 h-3" />
                  {errors.full_name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Lozinka
              </Label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••"
                className="h-11 text-base"
                autoComplete="new-password"
                minLength={8}
                maxLength={100}
                value={formData.password}
                onChange={handleChange}
                required
              />
              <PasswordStrengthIndicator
                password={formData.password}
                showRequirements={true}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Potvrdi lozinku
              </Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                className={`h-11 text-base ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                autoComplete="new-password"
                minLength={8}
                maxLength={100}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
              />
              {errors.confirmPassword && touched.confirmPassword && (
                <p id="confirm-error" className="text-xs text-red-500 flex items-center gap-1 animate-slide-up">
                  <AlertCircle className="w-3 h-3" />
                  {errors.confirmPassword}
                </p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 animate-slide-up">
                  <CheckCircle2 className="w-3 h-3" />
                  Lozinke se podudaraju
                </p>
              )}
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                required
              />
              <Label
                htmlFor="terms"
                className="text-xs font-normal cursor-pointer select-none leading-tight"
              >
                Slažem se s{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Uvjetima korištenja
                </Link>{' '}
                i{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Politikom privatnosti
                </Link>
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
              Već imate račun?{' '}
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
