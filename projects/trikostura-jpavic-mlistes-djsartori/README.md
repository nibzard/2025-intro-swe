# Studentski Forum

**Autori:** Jan Pavić | Damjan Josip Sartori | Marino Listeš

Online forum za studente svih sveučilišta u Hrvatskoj. Korisnici mogu stvarati i odgovarati na threadove, glasati za odgovore, i sudjelovati u diskusijama po kategorijama.

## 🚀 Značajke

### Implementirano ✅
- ✅ **Autentifikacija** - Registracija i prijava korisnika sa Supabase Auth
- ✅ **Forum kategorije** - 6 predefiniranih kategorija (Opće, Pitanja, Studij, Karijera, Tehnologija, Off-topic)
- ✅ **Teme (Topics)** - Kreiranje, pregled i listanje tema sa paginacijom
- ✅ **Odgovori (Replies)** - Komentiranje na teme sa real-time ažuriranjem
- ✅ **Glasanje** - Upvote/downvote sistem za odgovore
- ✅ **Pretraga** - Full-text pretraga kroz teme po naslovu i sadržaju
- ✅ **User profili** - Kompletni profili sa statistikama i aktivnostima
- ✅ **Responsive dizajn** - Prilagođeno za mobilne uređaje
- ✅ **Dark mode podrška** - Svijetla i tamna tema
- ✅ **Loading states** - Skeleton screens za bolji UX
- ✅ **Performance optimizacije** - ISR caching, image optimization

### Za implementaciju 🔨
- ⏳ **Editiranje profila** - Mogućnost uređivanja korisničkih podataka
- ⏳ **Admin panel** - Upravljanje korisnicima i sadržajem
- ⏳ **Notifikacije** - Real-time obavijesti za odgovore i glasove

## 🛠 Tech Stack

- **Frontend:** Next.js 16.0.7 (App Router), TypeScript, React 19.2.1
- **Styling:** Tailwind CSS 3.4.18, shadcn/ui komponente
- **Validation:** Zod 4.1.13
- **Backend:** Supabase (PostgreSQL) sa Row-Level Security
- **Authentication:** Supabase Auth sa SSR (@supabase/ssr)
- **Deployment:** Vercel (preporučeno)

### 🎯 Performance Features
- ✅ Incremental Static Regeneration (ISR)
- ✅ Image optimization (AVIF/WebP)
- ✅ Package tree-shaking (lucide-react, supabase)
- ✅ gzip compression
- ✅ Font preloading
- ✅ 0 security vulnerabilities

## 📦 Instalacija

### 1. Preduvjeti
- Node.js 18+ i npm
- Supabase račun ([supabase.com](https://supabase.com))

### 2. Install dependencies

```bash
npm install
```

### 3. Postavi Supabase

1. Idi na [supabase.com](https://supabase.com) i kreiraj novi projekt
2. Idi na **Settings > API** i kopiraj:
   - Project URL
   - anon/public key

### 4. Environment varijable

```bash
cp .env.example .env.local
```

Dodaj svoje podatke u `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tvoj-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tvoj-anon-key
```

### 5. Postavi bazu podataka

1. Idi u Supabase dashboard > **SQL Editor**
2. Kopiraj cijeli sadržaj iz `supabase/schema.sql`
3. Zalijepi u SQL Editor i pokreni

Ovo će kreirati sve tablice, politike, triggere i default kategorije.

**⚠️ Važno:** Idi na **Authentication > Providers > Email** i **isključi** "Confirm email" ako želiš testirati registraciju bez email potvrde.

### 6. Pokreni development server

```bash
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000)

## 👤 Kreiranje Admin Korisnika

Nakon registracije:

1. Idi u Supabase Dashboard > **Table Editor** > `profiles`
2. Pronađi svog korisnika
3. Promijeni `role` iz `student` u `admin`

## 📁 Struktura Projekta

```
/app
  /auth              # Login, register stranice
  /forum             # Forum stranice
    /category/[slug] # Kategorije
    /topic/[slug]    # Pojedinačna tema
    /user/[username] # User profili
    /search          # Pretraga tema
    /new             # Nova tema
    loading.tsx      # Loading states
/components
  /ui                # shadcn komponente
  /forum             # Forum komponente
  /layout            # Navbar
/lib
  /supabase          # Supabase client (SSR & client)
  /validations       # Zod schemas
/types               # TypeScript types
/supabase
  schema.sql         # Database schema
```

## 🚀 Deployment na Vercel

1. Push na GitHub
2. Import na [vercel.com](https://vercel.com)
3. Dodaj environment varijable
4. Deploy!

## 📊 Značajke

### Autentifikacija
- Registracija i prijava korisnika
- Email potvrda (opciono)
- Server-side rendering (SSR) za sigurnost

### Forum Funkcionalnosti
- **Kategorije**: 6 predefiniranih kategorija sa bojama
- **Teme**: Kreiranje novih tema, pinning, view count
- **Odgovori**: Komentiranje sa threaded replies
- **Glasanje**: Upvote/downvote sistem
- **Pretraga**: Full-text pretraga po naslovu i sadržaju

### User Profile
- Statistike korisnika (teme, odgovori, reputacija)
- Najnovije teme i odgovori
- Role badges (Admin, Moderator)
- Datum pridruživanja

### UI/UX
- Skeleton loading states
- Responsive design (mobile-first)
- Dark mode support
- Optimizirane slike (AVIF/WebP)

## 📄 Status

**✅ Production Ready** - All core features implemented and optimized

---

Za više detalja o optimizacijama, pogledaj [OPTIMIZATIONS.md](OPTIMIZATIONS.md)
Za detaljnije upute, pogledaj [SETUP.md](SETUP.md)
