# SnapNStore - OCR Receipt Processor

SnapNStore je moderna web aplikacija za automatsko prepoznavanje, parsiranje i pohranu podataka s računa koristeći Google Cloud Vision OCR i Google Gemini AI.

## Značajke

- 📸 **Google Cloud Vision OCR**: Izuzetno precizno čitanje teksta s fotografija računa.
- 🤖 **AI Parsiranje**: Korištenje Google Gemini AI za inteligentno izvlačenje podataka (trgovina, iznos, datum, artikli).
- 🗄️ **Lokalna baza podataka**: Pohrana podataka u lokalnu `database.json` datoteku koja ne zahtijeva internet niti vanjske servere.
- 🚀 **Vercel Ready**: Konfigurirano za brzo postavljanje na Vercel platformu.
- 🔍 **Pretraživanje**: Pretraživanje računa po trgovini ili datumu.

## Preduvjeti

Prije nego počnete, provjerite imate li sljedeće:
- Node.js instaliran (v18 ili noviji)
- Google Gemini API ključ ([aistudio.google.com](https://aistudio.google.com/))
- Google Cloud Vision API ključ (JSON datoteka vjerodajnica)

## Instalacija

1. Klonirajte repozitorij.
2. Instalirajte ovisnosti:
   ```bash
   npm install
   ```

3. Postavite `.env` datoteku u korijenskom direktoriju:
   ```env
   GEMINI_API_KEY=vaš-gemini-api-ključ
   GOOGLE_APPLICATION_CREDENTIALS="./vaša-datoteka-vjerodajnica.json"
   PORT=3000
   ```

4. Postavite svoju Google Cloud JSON datoteku u korijenski direktorij projekta i osigurajte da se naziv podudara s onim u `.env` datoteci.

## Kako koristiti aplikaciju

Slijedite ove korake kako biste uspješno koristili aplikaciju:

### 1. Pokretanje aplikacije lokalno
Nakon što ste instalirali ovisnosti i postavili `.env` datoteku, pokrenite server:
```bash
npm start
```
Aplikacija će biti dostupna na: `http://localhost:3000`

### 2. Korištenje putem web sučelja
1. Otvorite `http://localhost:3000` u svom pregledniku.
2. **Skeniranje (Kamera)**: 
   - Kliknite na tab "Skeniraj" u donjoj navigaciji.
   - Odaberite opciju "Kamera".
   - Fotografirajte račun klikom na gumb "Fotografiraj".
   - Kliknite na "Obrađi račun" za početak obrade.
3. **Učitavanje iz datoteka**: 
   - Kliknite na tab "Dokumenti" ili u tabu "Skeniraj" odaberite "Datoteka".
   - Odaberite sliku računa s uređaja (podržava više slika odjednom).
   - Kliknite na "Obrađi račun".
4. **Obrada**: Sustav će:
   - Pročitati tekst pomoću Google Cloud Vision-a.
   - Analizirati tekst pomoću Gemini AI-a.
   - Prikazati izdvojene podatke (datum, trgovina, artikli, iznos).
   - Automatski spremiti račun u lokalnu bazu.
5. **Pregled povijesti**: Na početnoj stranici ("Početna") možete vidjeti listu svih skeniranih računa.
6. **Pretraživanje**: Koristite tražilicu na početnoj stranici za pretragu po trgovini ili datumu.

### 3. Korištenje putem API-ja
Dostupni endpointi:
- `POST /api/receipts/process` - Šalje slike na OCR i AI obradu.
- `GET /api/receipts` - Dohvaća popis svih spremljenih računa.
- `GET /api/receipts/search?q=pojam` - Pretražuje račune.
- `GET /api/receipts/export` - Generira CSV izvoz.

## Deployment na Vercel

1. Dodajte Environment Variables na Vercel dashboardu:
   - `GEMINI_API_KEY`
   - `GOOGLE_APPLICATION_CREDENTIALS_JSON` (cijeli sadržaj JSON datoteke kao string)
2. Deployajte.

## Struktura projekta

- `src/index.js`: Glavni Express server.
- `src/ocr/ocrService.js`: Servis za Google Cloud Vision i Gemini AI.
- `src/parser/dataParser.js`: Lokalne regex zamjene za slučaj da AI ne odgovori.
- `src/storage/localDatabase.js`: Logika za interakciju s JSON bazom.
- `public/`: Frontend datoteke.

## Licenca

MIT
