# Melodia – Music Matcher (mobilna aplikacija)

Melodia je mobilna aplikacija koja povezuje korisnike na temelju glazbenog ukusa.
Aplikacija koristi Spotify podatke za izračun glazbene podudarnosti te prikazuje
korisnike na interaktivnoj karti uz mogućnost dopisivanja u stvarnom vremenu.

Projekt je razvijen kao mobilna aplikacija koristeći Expo (React Native) i Supabase
za autentifikaciju, bazu podataka i real-time funkcionalnosti.

✨ Značajke
🎵 Povezivanje sa Spotify računom (OAuth PKCE)
📊 Izračun postotka glazbene podudarnosti između korisnika
🗺️ Interaktivna karta s prikazom korisnika u blizini
💬 Real-time chat između korisnika
✍️ Ručni unos glazbenih podataka kao alternativa Spotifyju
📱 Moderan i responzivan mobilni UI

🛠️ Tehnologije
Expo (React Native)
TypeScript
Supabase (Authentication, Database, Realtime)
Spotify Web API
Expo Location
React Navigation

▶️ Pokretanje projekta lokalno

Preduvjeti
Node.js (preporučeno: LTS verzija)
npm
Expo Go aplikacija (Android / iOS)

Instalacija
```bash
cd mobile-app
npm install
Kreiranje .env datoteke

cp .env.example .env
U .env je potrebno definirati sljedeće varijable:

EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=
Pokretanje aplikacije

npx expo start
Aplikacija se pokreće skeniranjem QR koda u Expo Go aplikaciji.

📌 Napomena
Bez postavljenih environment varijabli aplikacija se može pokrenuti u demonstracijske
svrhe (UI), ali funkcionalnosti vezane uz Spotify i bazu podataka neće biti dostupne.

👤 Autor
Ime i prezime: Blago Vukšić
