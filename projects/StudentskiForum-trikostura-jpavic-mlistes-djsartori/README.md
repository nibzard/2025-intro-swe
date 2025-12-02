# Studentski Forum

Online forum za studente svih sveučilišta u Hrvatskoj. Korisnici mogu stvarati i odgovarati na teme, pretraživati forum, te upravljati svojim profilom.

## 🚀 Tehnologije

- **Frontend**: Next.js 16 (React) with TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (preporučeno)

## ✨ Značajke

### Za studente:
- ✅ Registracija korisničkog računa (UC1)
- ✅ Prijava u sustav (UC2)
- ✅ Pregled tema po kategorijama (UC3)
- ✅ Kreiranje novih tema (UC4)
- ✅ Odgovaranje na teme (UC5)
- ✅ Pretraživanje foruma (UC6)
- ✅ Uređivanje vlastitog profila (UC7)

### Za administratore:
- ✅ Upravljanje korisnicima - promjena uloga (UC12)
- ✅ Upravljanje kategorijama - dodavanje, uređivanje, brisanje (UC14)
- ✅ Pregled statistike - korisnici, teme, odgovori (UC15)

## 📋 Preduvjeti

- Node.js 18+ i npm
- Supabase račun ([supabase.com](https://supabase.com))

## 🛠️ Instalacija

### 1. Kloniraj projekt

```bash
cd studentski-forum
```

### 2. Instaliraj dependencies

```bash
npm install
```

### 3. Postavi Supabase

1. Kreiraj novi projekt na [supabase.com](https://supabase.com)
2. Otvori SQL Editor u Supabase dashboardu
3. Kopiraj i izvrši SQL iz `database/schema.sql`
4. Pročitaj dodatne upute u `database/README.md`

### 4. Konfiguriraj environment varijable

Kreiraj `.env.local` datoteku u root direktoriju:

```bash
cp .env.local.example .env.local
```

Popuni varijable sa svojim Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Ove podatke možeš pronaći u Supabase Dashboard > Settings > API.

### 5. Pokreni development server

```bash



```

Aplikacija će biti dostupna na [http://localhost:3000](http://localhost:3000).

## 📁 Struktura projekta

```
studentski-forum/
├── app/                      # Next.js App Router
│   ├── admin/               # Admin panel stranice
│   │   ├── users/          # Upravljanje korisnicima
│   │   └── categories/     # Upravljanje kategorijama
│   ├── forum/              # Forum stranice
│   │   ├── category/       # Pregled kategorija
│   │   ├── topic/          # Pregled pojedinačnih tema
│   │   ├── new/            # Kreiranje nove teme
│   │   └── search/         # Pretraga foruma
│   ├── login/              # Prijava
│   ├── register/           # Registracija
│   ├── profile/            # Korisnički profil
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles
├── components/             # React komponente
│   └── Header.tsx          # Navigacija
├── lib/                    # Utilities i konfiguracija
│   ├── supabase.ts        # Supabase client
│   ├── auth-context.tsx   # Auth context provider
│   └── types.ts           # TypeScript tipovi
├── database/              # Database schema i dokumentacija
│   ├── schema.sql        # SQL schema
│   └── README.md         # Database setup upute
└── public/               # Statički assets

```

## 🗄️ Baza podataka

Projekt koristi sljedeće tablice:

- **profiles**: Korisnički profili (proširenje auth.users)
- **categories**: Kategorije foruma
- **topics**: Forumske teme
- **responses**: Odgovori na teme

Detaljna dokumentacija dostupna je u `database/README.md`.

## 🔐 Autentikacija

Projekt koristi Supabase Authentication sa sljedećim ulogama:

- **student**: Standardni korisnik (default)
- **admin**: Administrator sa dodatnim privilegijama

### Kreiranje admin korisnika

1. Registriraj se kroz aplikaciju
2. Otvori Supabase Dashboard > Table Editor > profiles
3. Pronađi svog korisnika i promijeni `role` iz 'student' u 'admin'

## 🚢 Deployment

### Vercel (preporučeno)

1. Push kod na GitHub
2. Povezi repo sa [Vercel](https://vercel.com)
3. Dodaj environment varijable u Vercel dashboard
4. Deploy!

### Ostale platforme

Projekt se može deployati na bilo koju platformu koja podržava Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

## 📝 Skripta naredbe

```bash
# Development
npm run dev          # Pokreni development server
npm run build        # Build za production
npm run start        # Pokreni production server
npm run lint         # Lint kod
```

## 🤝 Doprinos

Ovaj projekt razvili su:
- Jan Pavić
- Damjan Josip Sartori
- Marino Listeš

## 📄 Licenca

ISC

## 🐛 Poznati problemi i TODO

- [ ] Dodati paginaciju za teme i odgovore
- [ ] Implementirati upload slika za profile
- [ ] Dodati notifikacije
- [ ] Implementirati like/upvote sistem
- [ ] Dodati report functionality za neprikladan sadržaj
- [ ] Optimizirati SEO meta tagove

## 💡 Napomene

- Svi novi korisnici automatski dobivaju 'student' ulogu
- Admin korisnici mogu upravljati svim temama i odgovorima
- Forum podržava markdown formatting u sadržaju
- Pretraga pretražuje naslove i sadržaj tema

---

**Razvijeno sa ❤️ za hrvatske studente**
