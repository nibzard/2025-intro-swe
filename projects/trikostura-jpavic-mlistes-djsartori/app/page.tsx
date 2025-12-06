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
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover-lift cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Studentska Zajednica
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Poveži se s kolegama iz cijele Hrvatske. Razmjenjuj iskustva i savjete.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover-lift cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Skripta i Materijali
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Pronađi skripte, bilješke i materijale za učenje iz različitih predmeta.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover-lift cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Lightbulb className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Pitaj i Odgovori
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Postavlja pitanja, dobij odgovore. Pomogni drugima svojim znanjem.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover-lift cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Priprema za Ispite
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Raspravljaj o ispitima, strategijama učenja i dijelite savjete za uspjeh.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover-lift cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Award className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Reputacijski Sustav
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Zarađuj reputaciju pomažući drugima. Izdvoji se u zajednici.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover-lift cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-7 h-7 text-white" />
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
