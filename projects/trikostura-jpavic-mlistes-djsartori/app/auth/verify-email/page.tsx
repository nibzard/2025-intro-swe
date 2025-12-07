'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyEmailCode, resendVerificationEmail } from './actions';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle, RefreshCw, LogOut } from 'lucide-react';
import { logout } from '@/app/auth/actions';

// Mask email for privacy (e.g., "j***@example.com")
function maskEmail(email: string): string {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = localPart.length > 2
    ? localPart[0] + '***' + localPart[localPart.length - 1]
    : localPart[0] + '***';
  return `${maskedLocal}@${domain}`;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get profile to check if already verified
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, email_verified')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserEmail((profile as any).email || user.email || '');
        if ((profile as any).email_verified) {
          setIsVerified(true);
        }
      }
    }

    checkUser();
  }, [router]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = useCallback((index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);

    setCode(prev => {
      const newCode = [...prev];
      newCode[index] = digit;
      return newCode;
    });

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [code]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
      setCode(newCode);
      // Focus the next empty input or the last one
      const nextEmptyIndex = newCode.findIndex(d => !d);
      inputRefs.current[nextEmptyIndex === -1 ? 5 : nextEmptyIndex]?.focus();
    }
  }, []);

  const fullCode = code.join('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fullCode.length !== 6) {
      toast.error('Unesite 6-znamenkasti kod');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Verificiram kod...');

    try {
      const formData = new FormData();
      formData.append('code', fullCode);

      const result = await verifyEmailCode(formData);

      if (result.success) {
        toast.success('Email uspješno verificiran!', { id: loadingToast });
        setIsVerified(true);

        // Redirect to forum after 2 seconds
        setTimeout(() => {
          router.push('/forum');
        }, 2000);
      } else {
        toast.error(result.error || 'Nevažeći kod', { id: loadingToast });
        // Clear code on error
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      toast.error('Došlo je do greške', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    setIsResending(true);
    const loadingToast = toast.loading('Šaljem novi kod...');

    try {
      const result = await resendVerificationEmail();

      if (result.success) {
        toast.success('Novi verifikacijski kod poslan!', { id: loadingToast });
        setCode(['', '', '', '', '', '']);
        setCooldown(60); // 60 second cooldown
        inputRefs.current[0]?.focus();
      } else {
        toast.error(result.error || 'Greška pri slanju', { id: loadingToast });
        // Set cooldown from server response if available
        if ((result as any).cooldownRemaining) {
          setCooldown((result as any).cooldownRemaining);
        }
      }
    } catch (error) {
      toast.error('Došlo je do greške', { id: loadingToast });
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Email verificiran!</CardTitle>
            <CardDescription>
              Vaš email je uspješno potvrđen. Sada možete koristiti sve funkcionalnosti Skripta platforme.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/forum">
              <Button className="w-full">Idite na forum</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Verificirajte svoj email</CardTitle>
            <CardDescription>
              Poslali smo 6-znamenkasti kod na<br />
              <strong className="text-gray-900 dark:text-gray-100">{maskEmail(userEmail)}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={isSubmitting}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all disabled:opacity-50"
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Kod vrijedi 15 minuta
                </p>
              </div>

              <Button type="submit" className="w-full h-11" disabled={isSubmitting || fullCode.length !== 6}>
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Verificiram...
                  </>
                ) : (
                  'Potvrdi email'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Niste primili kod?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={isResending || cooldown > 0}
                className="w-full h-11"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Šaljem...
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Pričekajte {cooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Pošalji novi kod
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Provjerite spam/junk folder ako ne vidite email
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Možete zalijepiti kod izravno (Ctrl+V)
          </p>
        </div>

        <div className="text-center pt-4">
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <LogOut className="w-4 h-4 mr-2" />
              Odjavi se
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
