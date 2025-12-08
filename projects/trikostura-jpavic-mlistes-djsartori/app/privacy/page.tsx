import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SkriptaLogo } from '@/components/branding/skripta-logo';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SkriptaLogo size={60} />
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Politika privatnosti</h1>
          <p className="text-gray-600 dark:text-gray-400">Zadnje ažurirano: 6. prosinca 2025.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-2xl font-bold mb-4">1. Uvod</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Skripta se obvezuje zaštititi vašu privatnost. Ova politika privatnosti objašnjava kako prikupljamo,
              koristimo i štitimo vaše osobne podatke.
            </p>

            <h2 className="text-2xl font-bold mb-4 mt-8">2. Podaci koje prikupljamo</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Prikupljamo sljedeće vrste podataka:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Informacije o računu:</strong> Korisničko ime, email adresa, lozinka (kriptirana)</li>
              <li><strong>Profilne informacije:</strong> Avatar, biografija, fakultet (opcionalno)</li>
              <li><strong>Sadržaj:</strong> Teme, odgovori, komentari i datoteke koje objavljujete</li>
              <li><strong>Podaci o korištenju:</strong> IP adresa, tip preglednika, vrijeme pristupa</li>
              <li><strong>Kolačići:</strong> Koristimo kolačiće za autentifikaciju i poboljšanje korisničkog iskustva</li>
            </ul>

            <h2 className="text-2xl font-bold mb-4 mt-8">3. Kako koristimo vaše podatke</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Vaše podatke koristimo za:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Pružanje i održavanje usluge</li>
              <li>Autentifikaciju i sigurnost računa</li>
              <li>Komunikaciju s vama (obavijesti, odgovori)</li>
              <li>Poboljšanje platforme i korisničkog iskustva</li>
              <li>Analizu korištenja platforme</li>
              <li>Sprječavanje zloupotrebe i kršenja pravila</li>
            </ul>

            <h2 className="text-2xl font-bold mb-4 mt-8">4. Dijeljenje podataka</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Vaše osobne podatke ne prodajemo trećim stranama. Podatke možemo podijeliti samo u sljedećim slučajevima:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Javni sadržaj:</strong> Teme, odgovori i javne profilne informacije vidljivi su svim korisnicima</li>
              <li><strong>Pružatelji usluga:</strong> Koristimo Supabase za hosting baze podataka (podaci se čuvaju sigurno)</li>
              <li><strong>Zakonske obveze:</strong> Ako je potrebno prema zakonu ili sudskim zahtjevima</li>
            </ul>

            <h2 className="text-2xl font-bold mb-4 mt-8">5. Zaštita podataka</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Primjenjujemo odgovarajuće tehničke i organizacijske mjere za zaštitu vaših podataka:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Lozinke se čuvaju kriptirane pomoću bcrypt algoritma</li>
              <li>Korištenje HTTPS enkripcije za sve komunikacije</li>
              <li>Redovite sigurnosne provjere i ažuriranja</li>
              <li>Ograničen pristup osobnim podacima samo ovlaštenom osoblju</li>
            </ul>

            <h2 className="text-2xl font-bold mb-4 mt-8">6. Vaša prava</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Imate sljedeća prava u vezi s vašim podacima:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Pristup:</strong> Možete zatražiti kopiju svojih osobnih podataka</li>
              <li><strong>Ispravak:</strong> Možete ažurirati ili ispraviti svoje podatke</li>
              <li><strong>Brisanje:</strong> Možete zatražiti brisanje svog računa i podataka</li>
              <li><strong>Prenosivost:</strong> Možete zatražiti prijenos podataka u strojno čitljivom formatu</li>
              <li><strong>Prigovor:</strong> Možete se usprotiviti određenim vrstama obrade podataka</li>
            </ul>

            <h2 className="text-2xl font-bold mb-4 mt-8">7. Kolačići</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Koristimo kolačiće za:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Autentifikaciju korisnika</li>
              <li>Spremanje korisničkih postavki (tema, jezik)</li>
              <li>Analizu prometa i korištenja platforme</li>
            </ul>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Možete kontrolirati kolačiće putem postavki svog preglednika.
            </p>

            <h2 className="text-2xl font-bold mb-4 mt-8">8. Zadržavanje podataka</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Čuvamo vaše osobne podatke dok god imate aktivan račun. Nakon brisanja računa, podaci se trajno
              uklanjaju u roku od 30 dana, osim ako zakon ne zahtijeva duže zadržavanje.
            </p>

            <h2 className="text-2xl font-bold mb-4 mt-8">9. Djeca</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Naša usluga nije namijenjena osobama mlađim od 13 godina. Ne prikupljamo svjesno osobne
              podatke djece mlađe od 13 godina.
            </p>

            <h2 className="text-2xl font-bold mb-4 mt-8">10. Izmjene politike</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Možemo povremeno ažurirati ovu politiku privatnosti. O značajnim izmjenama ćemo vas obavijestiti
              putem platforme ili e-maila.
            </p>

            <h2 className="text-2xl font-bold mb-4 mt-8">11. Kontakt</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Za pitanja o ovoj politici privatnosti ili zahtjeve u vezi s vašim podacima, molimo kontaktirajte
              nas putem foruma ili e-maila.
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
