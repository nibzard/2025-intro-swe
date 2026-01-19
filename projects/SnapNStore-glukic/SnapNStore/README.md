# SnapNStore - OCR Receipt Processor

SnapNStore je moderna web aplikacija za automatsko prepoznavanje, parsiranje i pohranu podataka s računa koristeći OCR (Tesseract.js) i Google Gemini AI.

## Značajke

- 📸 **OCR Prepoznavanje**: Automatsko čitanje teksta s fotografija računa.
- 🤖 **AI Parsiranje**: Korištenje Google Gemini AI za inteligentno izvlačenje podataka (trgovina, iznos, datum, artikli).
- 🗄️ **Lokalna baza podataka**: Pohrana podataka u lokalnu `database.json` datoteku koja ne zahtijeva internet niti vanjske servere.
- 🚀 **Vercel Ready**: Konfigurirano za brzo postavljanje na Vercel platformu.
- 🔍 **Pretraživanje**: Pretraživanje računa po trgovini ili datumu.

## Preduvjeti

Prije nego počnete, provjerite imate li sljedeće:
- Node.js instaliran (v18 ili noviji)
- Google Gemini API ključ ([aistudio.google.com](https://aistudio.google.com/))

## Instalacija

1. Klonirajte repozitorij.
2. Instalirajte ovisnosti:
   ```bash
   npm install
   ```

3. Postavite `.env` datoteku u korijenskom direktoriju:
   ```env
   GEMINI_API_KEY=your-gemini-api-key
   PORT=3000
   ```

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
   - Kliknite na "Obrađi račun" za početak OCR i AI obrade.
3. **Učitavanje iz fileova**: 
   - Kliknite na tab "Dokumenti" ili u tabu "Skeniraj" odaberite "Datoteka".
   - Odaberite sliku računa s uređaja (podržava odabir više slika odjednom).
   - Kliknite na "Obrađi račun".
4. **Obrada**: Sustav će:
   - Pročitati tekst s slike (OCR).
   - Analizirati tekst pomoću AI-a.
   - Prikazati izdvojene podatke (datum, trgovina, artikli, iznos).
   - Automatski spremiti račun u lokalnu datoteku.
5. **Pregled povijesti**: Na početnoj stranici ("Početna") možete vidjeti listu svih skeniranih računa.
6. **Pretraživanje**: Koristite tražilicu na početnoj stranici za pretragu po trgovini ili datumu.

### 3. Korištenje putem API-ja
Ako želite integrirati SnapNStore u druge sustave, koristite dostupne API endpointe:
- `POST /api/receipts/process` - Šalje slike na OCR i AI obradu.
- `GET /api/receipts` - Dohvaća popis svih spremljenih računa.
- `GET /api/receipts/search?q=pojam` - Pretražuje račune.
- `GET /api/receipts/export` - Generira i nudi download CSV izvoza.

## Deployment na Vercel

1. Instalirajte Vercel CLI ili povežite GitHub repozitorij s Vercel-om.
2. Dodajte Environment Variables na Vercel dashboardu:
   - `GEMINI_API_KEY`
3. Deployajte:
   ```bash
   vercel --prod
   ```

## Struktura projekta

- `src/index.js`: Glavni Express server.
- `src/storage/csvStorage.js`: Logika za interakciju s CSV datotekom.
- `src/ocr/ocrService.js`: Servis za Tesseract OCR.
- `src/parser/dataParser.js`: Logika za parsiranje podataka koristeći Gemini AI.
- `public/`: Frontend datoteke.

## Licenca

MIT
