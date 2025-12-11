import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SkriptaLogo } from '@/components/branding/skripta-logo';
import {
  HelpCircle, MessageSquare, UserPlus, FileText, Search,
  ThumbsUp, Bell, Settings, Shield, BookOpen
} from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <HelpCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">Centar za Pomoć</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Sve što trebaš znati o korištenju Skripta platforme
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <a href="#getting-started" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all group">
            <UserPlus className="w-8 h-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Početak korištenja</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kako se registrirati i započeti</p>
          </a>

          <a href="#posting" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all group">
            <MessageSquare className="w-8 h-8 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Objavljivanje</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kako postavljati teme i odgovore</p>
          </a>

          <a href="#community" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all group">
            <Shield className="w-8 h-8 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Pravila zajednice</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Što smijemo, a što ne</p>
          </a>
        </div>

        {/* Getting Started */}
        <div id="getting-started" className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 mb-8 border-2 border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Početak Korištenja</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                <span className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                Registracija
              </h3>
              <p className="text-gray-700 dark:text-gray-300 ml-10">
                Klikni na "Registriraj se" u gornjem desnom kutu. Trebat će ti samo email adresa, korisničko ime i lozinka.
                Email je potreban za potvrdu i povrat lozinke ako je zaboraviš.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                <span className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                Potvrda Email-a
              </h3>
              <p className="text-gray-700 dark:text-gray-300 ml-10">
                Provijeri svoju email poštu i klikni na link za potvrdu. Ako ne vidiš email, provjeri spam folder.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                <span className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                Postavi Profil
              </h3>
              <p className="text-gray-700 dark:text-gray-300 ml-10">
                Dodaj sliku profila, banner i bio. Navedi svoj fakultet i godinu studija da te drugi studenti lakše pronađu.
              </p>
            </div>
          </div>
        </div>

        {/* Posting */}
        <div id="posting" className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 mb-8 border-2 border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Objavljivanje Sadržaja</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-500" />
                Kako stvoriti novu temu?
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-2">
                <li>Klikni na "Nova tema" ili "+" gumb u kategoriji</li>
                <li>Odaberi odgovarajuću kategoriju (Matematika, Programiranje, Jezik, itd.)</li>
                <li>Napiši opisni naslov - budi specifičan!</li>
                <li>Opiši problem ili pitanje detaljno</li>
                <li>Dodaj attachmente ako je potrebno (slike, dokumenti)</li>
                <li>Klikni "Objavi"</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                Savjeti za kvalitetne objave
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-2">
                <li><strong>Budi jasan</strong> - Piši tako da svi mogu razumjeti tvoj problem</li>
                <li><strong>Dodaj kontekst</strong> - Objasni što si već pokušao</li>
                <li><strong>Koristi markdown</strong> - Format kod, formule, liste</li>
                <li><strong>Provjeri pravopis</strong> - Lakše je čitati uredne poruke</li>
                <li><strong>Označi riješeno</strong> - Kada dobiješ odgovor, označi najbolji</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-500" />
                Prije postavljanja pitanja
              </h3>
              <p className="text-gray-700 dark:text-gray-300 ml-2 mb-2">
                Pretraži forum - možda je netko već postavio isto pitanje! Koristi search bar za brzo pronalaženje.
              </p>
            </div>
          </div>
        </div>

        {/* Community Guidelines */}
        <div id="community" className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 mb-8 border-2 border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Pravila Zajednice</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border-2 border-green-200 dark:border-green-800">
              <h3 className="text-lg font-bold mb-3 text-green-800 dark:text-green-300 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5" />
                Što je dobrodošlo:
              </h3>
              <ul className="space-y-2 text-green-700 dark:text-green-300">
                <li>✅ Pitanja o predmetima i ispitima</li>
                <li>✅ Dijeljenje materijala i bilješki</li>
                <li>✅ Pomaganje drugim studentima</li>
                <li>✅ Konstruktivna diskusija</li>
                <li>✅ Savjeti o učenju i organizaciji</li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border-2 border-red-200 dark:border-red-800">
              <h3 className="text-lg font-bold mb-3 text-red-800 dark:text-red-300 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Što nije dozvoljeno:
              </h3>
              <ul className="space-y-2 text-red-700 dark:text-red-300">
                <li>❌ Uvrede i diskriminacija</li>
                <li>❌ Spam i oglašavanje</li>
                <li>❌ Plagijat i varanje</li>
                <li>❌ Dijeljenje tuđih kontakata bez dopuštenja</li>
                <li>❌ Neprikladan sadržaj (NSFW)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 mb-8 border-2 border-gray-100 dark:border-gray-700">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">Korisne Značajke</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Notifikacije</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 ml-13">
                Prati teme koje te zanimaju i budi obaviješten kada netko odgovori.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Pretraga</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 ml-13">
                Pretraži sve teme i odgovore - pronađi što ti treba u sekundi.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Reputacija</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 ml-13">
                Zarađuj bodove pomažući drugima. Viša reputacija = veće povjerenje.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Personalizacija</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 ml-13">
                Prilagodi profil, temu (dark/light mode) i notifikacije po svojoj želji.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl p-8 md:p-12 text-white mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Još Pitanja?</h2>
          <p className="text-center text-lg mb-8">
            Nisi pronašao odgovor? Objavi pitanje na forumu ili kontaktiraj support tim!
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/forum">
              <Button variant="outline" size="lg" className="bg-white text-blue-600 hover:bg-gray-100 border-0">
                Postavi pitanje na forum
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="bg-white/10 text-white hover:bg-white/20 border-white/30">
                Saznaj više o nama
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
