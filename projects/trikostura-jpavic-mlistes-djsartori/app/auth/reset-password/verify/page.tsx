'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SkriptaLogo } from '@/components/branding/skripta-logo';
import { AlertCircle, Key, Lock } from 'lucide-react';
import { verifyResetCodeAndUpdatePassword } from '@/app/auth/actions';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator';

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
          Resetiranje...
        </>
      ) : (
        <>
          <Key className="w-4 h-4" />
          Resetiraj lozinku
        </>
      )}
    </Button>
  );
}

export default function VerifyResetCodePage() {
  const [state, formAction] = useActionState(verifyResetCodeAndUpdatePassword, undefined);
  const [formData, setFormData] = useState({
    code: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    if (name === 'code' && value && value.length !== 6) {
      newErrors.code = 'Kod mora imati 6 znamenki';
    } else if (name === 'code') {
      delete newErrors.code;
    }

    if (name === 'confirmPassword') {
      if (value && value !== formData.password) {
        newErrors.confirmPassword = 'Lozinke se ne podudaraju';
      } else {
        delete newErrors.confirmPassword;
      }
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
            Unesite svoj 6-znamenkasti kod i novu lozinku
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
              <Label htmlFor="code" className="text-sm font-medium">
                Reset kod
              </Label>
              <Input
                id="code"
                name="code"
                type="text"
                placeholder="123456"
                className={`h-11 text-base text-center text-2xl tracking-widest font-bold ${errors.code ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                maxLength={6}
                value={formData.code}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={errors.code ? 'true' : 'false'}
              />
              {errors.code && touched.code && (
                <p className="text-xs text-red-500 flex items-center gap-1 animate-slide-up">
                  <AlertCircle className="w-3 h-3" />
                  {errors.code}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Nova lozinka
              </Label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••"
                className="h-11 text-base"
                autoComplete="new-password"
                minLength={6}
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
                minLength={6}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              />
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1 animate-slide-up">
                  <AlertCircle className="w-3 h-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 px-4 sm:px-6 pb-5 sm:pb-6">
            <SubmitButton />

            <div className="text-center">
              <Link
                href="/auth/reset-password"
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                <span>←</span> Natrag na zahtjev za reset
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
