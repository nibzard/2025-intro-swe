import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SkriptaLogo } from '@/components/branding/skripta-logo';
import { Heart, Users, Target, Lightbulb, TrendingUp, Shield } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <SkriptaLogo size={100} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-4">O Skripti</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Tvoja digitalna skripta - mjesto gdje se hrvatski studenti okupljaju, dijele znanje i zajedno uspijevaju
          </p>
        </div>

        {/* Mission */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 mb-12 border-2 border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Naša Misija</h2>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Skripta je nastala iz potrebe studenata da imaju centralno mjesto za razmjenu znanja, iskustava i materijala.
            Vjerujemo da učenje ne mora biti usamljeno i da je zajednica najmoćniji alat za uspjeh.
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            Naša misija je spojiti studente iz cijele Hrvatske i stvoriti okruženje gdje svatko može pronaći pomoć,
            podijeliti svoje znanje i izgraditi vrijedne veze koje će trajati cijeli život.
          </p>
        </div>

        {/* Values */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Naše Vrijednosti</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border-2 border-gray-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Zajednica</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Vjerujemo u snagu kolektivnog znanja. Zajedno smo jači, pametniji i uspješniji.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border-2 border-gray-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Podrška</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Svaki student zaslužuje podršku. Ovdje nećeš biti sam - uvijek će biti netko spreman pomoći.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border-2 border-gray-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
                <Lightbulb className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Inovacija</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Stalno se razvijamo i poboljšavamo kako bi iskustvo učenja bilo što bolje i modernije.
              </p>
            </div>
          </div>
        </div>

        {/* Story */}
        <div className="bg-gradient-to-br from-red-500 to-blue-600 rounded-3xl shadow-2xl p-8 md:p-12 mb-12 text-white">
          <h2 className="text-3xl font-bold mb-6">Naša Priča</h2>
          <div className="space-y-4 text-lg leading-relaxed">
            <p>
              Skripta je započela kao jednostavna ideja - što ako bi studenti imali mjesto gdje mogu slobodno pitati,
              odgovarati i dijeliti materijale bez straha od osuđivanja?
            </p>
            <p>
              Shvatili smo da mnogi studenti prolaze kroz iste izazove, ali često se osjećaju izolirano. Zašto ne
              stvoriti mjesto gdje bi mogli spojiti snage i zajedno savladati fakultetske prepreke?
            </p>
            <p>
              Danas, Skripta je dom za tisuće studenata iz cijele Hrvatske. Od FER-a do PMF-a, od EFZG-a do FSB-a -
              svi smo ovdje jednaki, svi učimo jedni od drugih.
            </p>
            <p className="font-semibold">
              I ovo je tek početak naše priče. S tobom, možemo je učiniti još boljom! 🚀
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 mb-12 border-2 border-gray-100 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Skripta u Brojkama</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-2">1000+</div>
              <div className="text-gray-600 dark:text-gray-400">Aktivnih studenata</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-400">Tema</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-400">Fakulteta</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-400">Dostupnost</div>
            </div>
          </div>
        </div>

        {/* Team/Community */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 mb-12 border-2 border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Sigurnost i Privatnost</h2>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Tvoja sigurnost i privatnost su nam prioritet. Koristimo najnovije sigurnosne standarde kako bi tvoji podaci
            bili zaštićeni. Nikada nećemo prodavati tvoje informacije trećim stranama.
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            Naš tim moderatora aktivno prati sadržaj kako bi zajednica ostala sigurna i prijateljska za sve.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Spreman postati dio zajednice?
          </h2>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/auth/register">
              <Button variant="gradient" size="xl" className="shadow-2xl">
                Registriraj se besplatno
              </Button>
            </Link>
            <Link href="/forum">
              <Button variant="outline" size="xl">
                Istražuj forum
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
