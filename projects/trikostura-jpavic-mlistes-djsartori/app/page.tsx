import Link from "next/link";
import { MessageSquare, Users, BookOpen, Award, TrendingUp, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-blue-200 dark:border-blue-800 shadow-lg">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Hrvatski Online Forum za Studente
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                  Studentski
                </span>
                <br />
                <span className="text-gray-900 dark:text-white">Forum</span>
              </h1>

              <p className="max-w-2xl mx-auto text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Pridruži se tisućama studenata koji dijele znanje, postavljaju pitanja i grade budućnost zajedno
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center flex-wrap pt-4">
              <Link
                href="/forum"
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                Istraži Forum
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/auth/register"
                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Registriraj se
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 max-w-4xl mx-auto">
              {[
                { label: "Studenata", value: "10K+", icon: Users },
                { label: "Tema", value: "5K+", icon: MessageSquare },
                { label: "Odgovora", value: "50K+", icon: BookOpen },
                { label: "Rješenja", value: "3K+", icon: Award },
              ].map((stat, i) => (
                <div key={i} className="group cursor-default">
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                    <stat.icon className="w-8 h-8 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Zašto odabrati naš forum?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Sve što ti treba za uspješno studiranje na jednom mjestu
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: "Diskusije u Realnom Vremenu",
                description: "Postavljaj pitanja i dobivaj odgovore od kolega studenata i stručnjaka iz različitih područja.",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: Award,
                title: "Sustav Reputacije",
                description: "Zaraduj badge-ove i reputation bodove pomažući drugima i dijeljenjem kvalitetnog sadržaja.",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                icon: TrendingUp,
                title: "Napredne Funkcije",
                description: "Markdown formatiranje, prilaganje datoteka, syntax highlighting za kod, i još mnogo toga.",
                gradient: "from-orange-500 to-red-500",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-transparent hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                Sve što ti treba za uspjeh na studiju
              </h2>
              <div className="space-y-4">
                {[
                  "Dijeli i preuzimaj materijale za učenje",
                  "Pronađi studijske partnere",
                  "Dobivaj pomoć u realnom vremenu",
                  "Sačuvaj korisne postove za kasnije",
                  "Prati najnovije teme i odgovore",
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-lg text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/forum"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Započni sada
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative">
              <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-1">
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-8">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    <div className="h-32 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl"></div>
                    <div className="flex gap-2">
                      <div className="h-10 bg-blue-500 rounded-lg flex-1"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-1"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400 rounded-full blur-2xl opacity-50"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-pink-400 rounded-full blur-2xl opacity-50"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/10"></div>
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Spremni za početak?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Pridruži se zajednici studenata danas i iskoristi sve prednosti našeg foruma
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href="/auth/register"
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Registriraj se besplatno
                </Link>
                <Link
                  href="/auth/login"
                  className="px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold border-2 border-white/20 transform hover:scale-105 transition-all duration-200"
                >
                  Već imaš račun?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
