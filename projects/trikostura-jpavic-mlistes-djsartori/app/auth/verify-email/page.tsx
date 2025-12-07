'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyEmailCode, resendVerificationEmail } from './actions';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

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
        setUserEmail((profile as any).email);
        if ((profile as any).email_verified) {
          setIsVerified(true);
        }
      }
    }

    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      toast.error('Unesite 6-znamenkasti kod');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Verificiram kod...');

    try {
      const formData = new FormData();
      formData.append('code', code);

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
      }
    } catch (error) {
      toast.error('Došlo je do greške', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    const loadingToast = toast.loading('Šaljem novi kod...');

    try {
      const result = await resendVerificationEmail();

      if (result.success) {
        toast.success('Novi verifikacijski kod poslan!', { id: loadingToast });
        setCode('');
      } else {
        toast.error(result.error || 'Greška pri slanju', { id: loadingToast });
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
        <Link href="/forum" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
          <ArrowLeft className="w-4 h-4" />
          Natrag
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Verificirajte svoj email</CardTitle>
            <CardDescription>
              Poslali smo 6-znamenkasti kod na<br />
              <strong>{userEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Unesite 6-znamenkasti kod"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  disabled={isSubmitting}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Kod vrijedi 15 minuta
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || code.length !== 6}>
                {isSubmitting ? 'Verificiram...' : 'Potvrdi email'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Niste primili kod?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={isResending}
                className="w-full"
              >
                {isResending ? 'Šaljem...' : 'Pošalji novi kod'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Provjerite spam/junk folder ako ne vidite email
        </p>
      </div>
    </div>
  );
}
