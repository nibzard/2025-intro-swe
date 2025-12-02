import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center animate-fade-in">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
                Studentski Forum
              </h1>
              <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto font-light">
                Online zajednica za studente svih sveučilišta u Hrvatskoj
              </p>
              <p className="text-lg text-blue-50 mb-12 max-w-2xl mx-auto">
                Postavljaj pitanja, dijeli znanje i poveži se sa studentima iz cijele Hrvatske
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-16">
                <Link
                  href="/register"
                  className="group relative px-8 py-4 bg-white text-purple-600 font-semibold rounded-full hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  <span className="relative z-10">Registriraj se besplatno</span>
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-purple-600 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  Prijavi se
                </Link>
                <Link
                  href="/forum"
                  className="px-8 py-4 bg-purple-500/30 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-full hover:bg-purple-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  Pregledaj Forum →
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto text-white">
                <div className="animate-slide-up">
                  <div className="text-4xl font-bold mb-2">1000+</div>
                  <div className="text-blue-100 text-sm">Studenata</div>
                </div>
                <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
                  <div className="text-4xl font-bold mb-2">500+</div>
                  <div className="text-blue-100 text-sm">Tema</div>
                </div>
                <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
                  <div className="text-4xl font-bold mb-2">5</div>
                  <div className="text-blue-100 text-sm">Kategorija</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4 gradient-text">
            Što možeš raditi?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Pridruži se aktivnoj studentskoj zajednici
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="card-hover bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
            </div>
            <h3 className="text-2xl font-bold mb-4">Za studente</h3>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Pregledaj teme po kategorijama
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Kreiraj nove diskusije
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Odgovaraj i pomozi drugima
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Pretraživanje cijelog foruma
              </li>
            </ul>
          </div>

          <div className="card-hover bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
            </div>
            <h3 className="text-2xl font-bold mb-4">Za administratore</h3>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Upravljanje korisnicima
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Uređivanje kategorija
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Pregled statistike
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Moderacija sadržaja
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Spreman za početak?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Pridruži se tisućama studenata već danas
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 bg-white text-purple-600 font-bold rounded-full hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Kreiraj besplatni račun
          </Link>
        </div>
      </div>
    </div>
  );
}
