import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SkriptaLogo } from "@/components/branding/skripta-logo";
import { MessageSquare, Users, BookOpen, Lightbulb, TrendingUp, Award, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="animate-pulse-slow">
              <SkriptaLogo size={120} />
            </div>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-skripta text-white rounded-full text-sm font-medium mb-4 animate-slide-up shadow-lg">
              <Sparkles className="w-4 h-4" />
              Najbolja studentska zajednica u Hrvatskoj
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-gradient animate-slide-up">
              Skripta
            </h1>
            <p className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 font-semibold animate-slide-up">
              Tvoja Digitalna Skripta
            </p>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto animate-slide-up">
              Spoji se s kolegama, dijeli znanje, pronađi odgovore na pitanja iz faksa.
              Zajednica hrvatskih studenata na jednom mjestu.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center gap-4 pt-4 flex-wrap">
            <Link href="/forum">
              <Button variant="gradient" size="xl" className="group shadow-xl">
                <MessageSquare className="w-5 h-5" />
                Pokreni Skriptu
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300" />
              <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all">
                <Users className="w-10 h-10 mx-auto mb-3 text-red-500" />
                <div className="text-4xl font-bold bg-gradient-to-br from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">1000+</div>
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Studenata</div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300" />
              <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                <div className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">500+</div>
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Tema</div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300" />
              <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all">
                <Sparkles className="w-10 h-10 mx-auto mb-3 text-purple-500" />
                <div className="text-4xl font-bold bg-gradient-to-br from-purple-600 to-purple-600 bg-clip-text text-transparent mb-2">24/7</div>
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Podrška</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Zašto Skripta?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-300" />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-2 border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                Studentska Zajednica
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Poveži se s kolegama iz cijele Hrvatske. Razmjenjuj iskustva i savjete.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-300" />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-2 border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                Skripta i Materijali
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Pronađi skripte, bilješke i materijale za učenje iz različitih predmeta.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-300" />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-2 border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                Pitaj i Odgovori
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Postavlja pitanja, dobij odgovore. Pomogni drugima svojim znanjem.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-300" />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-2 border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                Priprema za Ispite
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Raspravljaj o ispitima, strategijama učenja i dijelite savjete za uspjeh.
              </p>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-300" />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-2 border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                Reputacijski Sustav
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Zarađuj reputaciju pomažući drugima. Izdvoji se u zajednici.
              </p>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-300" />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-2 border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                Diskusije u Realnom Vremenu
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Brze obavijesti i odgovori. Ostani povezan s kolegama non-stop.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
          Kako funkcionira?
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
          Počni koristiti Skriptu u tri jednostavna koraka
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white text-3xl font-bold mb-6 shadow-xl">
              1
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Registriraj se besplatno</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Stvori račun u manje od minute. Potreban je samo email i korisničko ime.
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-3xl font-bold mb-6 shadow-xl">
              2
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Istražuj i postavi pitanja</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Pregledaj kategorije, čitaj postojeće teme ili postavi novo pitanje koje te zanima.
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white text-3xl font-bold mb-6 shadow-xl">
              3
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Pomozi zajednici</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Dijeli svoje znanje, odgovaraj na pitanja i zarađuj reputaciju u zajednici.
            </p>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50 dark:bg-gray-900/50 rounded-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
          Što kažu studenti?
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
          Pridruži se tisućama zadovoljnih studenata
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                M
              </div>
              <div className="ml-3">
                <div className="font-bold text-gray-900 dark:text-white">Marko</div>
                <div className="text-sm text-gray-500">FER Zagreb</div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 italic">
              "Skripta mi je pomogla proći najteže kolegije. Odgovori zajednice su bili brži i korisniji od čekanja profesora."
            </p>
            <div className="mt-4 text-yellow-500">⭐⭐⭐⭐⭐</div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                A
              </div>
              <div className="ml-3">
                <div className="font-bold text-gray-900 dark:text-white">Ana</div>
                <div className="text-sm text-gray-500">PMF Split</div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 italic">
              "Konačno mjesto gdje mogu pronaći materijale i savjete od studenata koji su prošli iste ispite. Nezamjenjivo!"
            </p>
            <div className="mt-4 text-yellow-500">⭐⭐⭐⭐⭐</div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                L
              </div>
              <div className="ml-3">
                <div className="font-bold text-gray-900 dark:text-white">Luka</div>
                <div className="text-sm text-gray-500">EFZG</div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 italic">
              "Upoznao sam kolege s drugih fakulteta i našao studijsku grupu. Zajednica je stvarno prijateljska i susretljiva!"
            </p>
            <div className="mt-4 text-yellow-500">⭐⭐⭐⭐⭐</div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Često postavljana pitanja
        </h2>

        <div className="space-y-4">
          <details className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
            <summary className="cursor-pointer p-6 font-bold text-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between">
              Je li Skripta potpuno besplatna?
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-6 pt-0 text-gray-600 dark:text-gray-400">
              Da! Skripta je potpuno besplatna platforma za sve studente. Nema skrivenih troškova, premium paketa ili oglasa.
              Naša misija je pomoći studentima da uspiju u studiju kroz zajednicu i dijeljenje znanja.
            </div>
          </details>

          <details className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
            <summary className="cursor-pointer p-6 font-bold text-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between">
              Tko može koristiti Skriptu?
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-6 pt-0 text-gray-600 dark:text-gray-400">
              Skripta je namijenjena svim studentima u Hrvatskoj, bez obzira na fakultet ili smjer. Također su dobrodošli
              brucoši koji tek ulaze u svijet studiranja i trebaju pomoć s prilagodbom na novi način učenja.
            </div>
          </details>

          <details className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
            <summary className="cursor-pointer p-6 font-bold text-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between">
              Kako funkcionira reputacijski sustav?
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-6 pt-0 text-gray-600 dark:text-gray-400">
              Kada pomažeš drugima kvalitetnim odgovorima, dobivaš reputaciju putem ocjena drugih korisnika. Veća reputacija
              znači da si pouzdaniji izvor informacija i da aktivno doprinosiš zajednici. To ti omogućava da se istakneš i eventualno dobiješ posebne privilegije na platformi.
            </div>
          </details>

          <details className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
            <summary className="cursor-pointer p-6 font-bold text-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between">
              Mogu li dijeliti skripte i materijale?
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-6 pt-0 text-gray-600 dark:text-gray-400">
              Naravno! Možeš priložiti dokumente, slike i druge materijale uz svoje objave. Molimo samo da poštuješ
              autorska prava i da ne dijeliš sadržaj koji nije tvoj ili za koji nemaš dopuštenje za dijeljenje.
            </div>
          </details>

          <details className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
            <summary className="cursor-pointer p-6 font-bold text-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between">
              Kako prijaviti neprikladan sadržaj?
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-6 pt-0 text-gray-600 dark:text-gray-400">
              Svaki post ima opciju prijave (report). Naš tim moderatora pregledava sve prijave i poduzima odgovarajuće mjere.
              Trudimo se održati zajednicu sigurnom i prijateljskom za sve korisnike.
            </div>
          </details>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-300" />
          <div className="relative bg-gradient-to-r from-red-600 to-blue-600 rounded-3xl p-12 sm:p-16 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-white" />
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Spreman za učenje?
              </h2>
              <p className="text-xl md:text-2xl text-white/95 mb-10 max-w-2xl mx-auto">
                Pridruži se tisućama studenata koji već koriste Skriptu
              </p>
              <Link
                href="/auth/register"
                className="inline-block px-12 py-5 bg-white text-red-600 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:shadow-white/20 transform hover:-translate-y-1 hover:scale-105"
              >
                Počni besplatno →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <SkriptaLogo size={32} />
                <span className="font-bold text-lg text-gray-900 dark:text-white">Skripta</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hrvatski forum za studente - dijeli znanje, pronađi pomoć, uspijevaj zajedno.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">O Platformi</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                    O nama
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                    Pomoć i vodič
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                    Uvjeti korištenja
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                    Privatnost
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Zajednica</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/forum" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                    Forum
                  </Link>
                </li>
                <li>
                  <Link href="/forum/users" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                    Korisnici
                  </Link>
                </li>
                <li>
                  <Link href="/forum/search" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                    Pretraživanje
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Započni</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/auth/register" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                    Registracija
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                    Prijava
                  </Link>
                </li>
                <li>
                  <Link href="/help#getting-started" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                    Kako započeti
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">© 2025 Skripta. Sva prava pridržana.</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              Hrvatski forum za studente 🇭🇷
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
