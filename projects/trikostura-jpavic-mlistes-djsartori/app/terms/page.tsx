import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SkriptaLogo } from '@/components/branding/skripta-logo';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SkriptaLogo size={60} />
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Uvjeti korištenja</h1>
          <p className="text-gray-600 dark:text-gray-400">Zadnje ažurirano: 6. prosinca 2025.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-2xl font-bold mb-4">1. Prihvaćanje uvjeta</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Korištenjem Skripta platforme pristajete na ove Uvjete korištenja. Ako se ne slažete s bilo kojim dijelom ovih uvjeta,
              molimo ne koristite našu platformu.
            </p>

            <h2 className="text-2xl font-bold mb-4 mt-8">2. Opis usluge</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Skripta je studentski forum namijenjen hrvatskim studentima za razmjenu znanja, iskustava i materijala za učenje.
              Platforma omogućava stvaranje tema, odgovaranje na pitanja, dijeljenje dokumenata i interakciju sa zajednicom.
            </p>

            <h2 className="text-2xl font-bold mb-4 mt-8">3. Korisnički računi</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Za korištenje određenih značajki platforme potrebno je stvoriti korisnički račun. Odgovorni ste za:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Čuvanje povjerljivosti vaših podataka za prijavu</li>
              <li>Sve aktivnosti koje se odvijaju pod vašim računom</li>
              <li>Odmah obavijestiti nas o neovlaštenom korištenju vašeg računa</li>
            </ul>

            <h2 className="text-2xl font-bold mb-4 mt-8">4. Pravila ponašanja</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Koristeći Skriptu, slažete se da nećete:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Objavljivati uvredljiv, diskriminirajući ili neprikladan sadržaj</li>
              <li>Kršiti autorska prava ili druga prava intelektualnog vlasništva</li>
              <li>Zloupotrebljavati ili uznemiravati druge korisnike</li>
              <li>Objavljivati spam ili neželjeni marketinški sadržaj</li>
              <li>Dijeliti lažne ili obmanjujuće informacije</li>
              <li>Pokušavati narušiti sigurnost platforme</li>
            </ul>

            <h2 className="text-2xl font-bold mb-4 mt-8">5. Sadržaj</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Zadržavate sva prava na sadržaj koji objavljujete na Skripti. Međutim, davanjem sadržaja platformi,
              dajete nam neekskluzivnu licencu za korištenje, prikazivanje i distribuciju tog sadržaja u svrhu pružanja usluge.
            </p>

            <h2 className="text-2xl font-bold mb-4 mt-8">6. Moderacija</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Zadržavamo pravo moderirati, uređivati ili ukloniti bilo koji sadržaj koji krši ove uvjete.
              Također možemo suspendirati ili trajno deaktivirati račune koji krše pravila platforme.
            </p>

            <h2 className="text-2xl font-bold mb-4 mt-8">7. Ograničenje odgovornosti</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Skripta se pruža "kakva jest". Ne jamčimo točnost, potpunost ili korisnost sadržaja na platformi.
              Nismo odgovorni za bilo kakve štete nastale korištenjem platforme.
            </p>

            <h2 className="text-2xl font-bold mb-4 mt-8">8. Izmjene uvjeta</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Zadržavamo pravo izmjene ovih uvjeta u bilo kojem trenutku. Korisnici će biti obaviješteni o
              značajnim izmjenama putem platforme ili e-maila.
            </p>

            <h2 className="text-2xl font-bold mb-4 mt-8">9. Kontakt</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Za pitanja o ovim uvjetima korištenja, molimo kontaktirajte nas putem foruma ili e-maila.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Link href="/auth/register">
            <Button variant="outline" size="lg" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Natrag na registraciju
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
