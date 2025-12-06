import Link from "next/link";
import { SkriptaLogo } from "@/components/branding/skripta-logo";
import { MessageSquare, Users, BookOpen, Lightbulb, TrendingUp, Award } from "lucide-react";

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
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-blue-600 bg-clip-text text-transparent">
              Skripta
            </h1>
            <p className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 font-medium">
              Tvoja Digitalna Skripta
            </p>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Spoji se s kolegama, dijeli znanje, pronađi odgovore na pitanja iz faksa.
              Zajednica hrvatskih studenata na jednom mjestu.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center pt-4">
            <Link
              href="/forum"
              className="group px-10 py-5 bg-gradient-to-r from-red-600 to-blue-600 text-white rounded-2xl font-bold text-lg hover:from-red-700 hover:to-blue-700 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105"
            >
              <span className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6" />
                Pokreni Skriptu
              </span>
            </Link>
          </div>

          {/* Stats */}
          <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-red-600">1000+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Studenata</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-blue-600">500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tema</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-red-600">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Podrška</div>
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Studentska Zajednica
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Poveži se s kolegama iz cijele Hrvatske. Razmjenjuj iskustva i savjete.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Skripta i Materijali
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Pronađi skripte, bilješke i materijale za učenje iz različitih predmeta.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-4">
              <Lightbulb className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Pitaj i Odgovori
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Postavlja pitanja, dobij odgovore. Pomogni drugima svojim znanjem.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Priprema za Ispite
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Raspravljaj o ispitima, strategijama učenja i dijelite savjete za uspjeh.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Reputacijski Sustav
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Zarađuj reputaciju pomažući drugima. Izdvoji se u zajednici.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Diskusije u Realnom Vremenu
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Brze obavijesti i odgovori. Ostani povezan s kolegama non-stop.
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-gradient-to-r from-red-600 to-blue-600 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Spreman za učenje?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Pridruži se tisućama studenata koji već koriste Skriptu
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-10 py-4 bg-white text-red-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Počni besplatno
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>© 2025 Skripta. Sva prava pridržana.</p>
          <p className="mt-2 text-sm">
            Hrvatski forum za studente 🇭🇷
          </p>
        </div>
      </div>
    </div>
  );
}
