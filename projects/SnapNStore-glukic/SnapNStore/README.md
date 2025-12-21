# SnapNStore - OCR Receipt Processor

OCR aplikacija za automatsko prepoznavanje i pohranu računa

## About

SnapNStore je web aplikacija koja omogućuje automatsko prepozavanje teksta sa računa koristeći OCR (Optical Character Recognition) tehnologiju. Aplikacija služi za jednostavno digitaliziranje i organiziranje računa.

## Features

- OCR prepoznavanje teksta sa računa
- Podrška za engleski i hrvatski jezik
- Automatska obrada i ekstrakcija podataka
- Izvoz podataka u CSV format
- Web sučelje za upload i pregled

## Requirements

- Node.js (verzija 16 ili novija)
- npm (verzija 7 ili novija)
- Google AI API ključ

## Installation

1. Klonirajte repozitorij:
```bash
git clone https://github.com/vas-username/SnapNStore-glukic.git
cd SnapNStore-glukic/SnapNStore
```

2. Instalirajte ovisnosti:
```bash
npm install
```

3. Postavite environment varijable:
```bash
cp .env.example .env
```

4. Dodajte vaš Google AI API ključ u `.env` datoteku:
```
GOOGLE_AI_API_KEY=vas_google_ai_api_kljuc
```

## Usage

1. Pokrenite aplikaciju:
```bash
npm start
```

2. Otvorite web preglednik i idite na `http://localhost:3000`

3. Upload-ujte sliku računa putem web sučelja

4. Pregledajte prepoznate podatke i spremite ih u CSV format

## API Endpoints

- `POST /upload` - Upload-ujte sliku računa za OCR obradu
- `GET /` - Prikaz glavne stranice
- `GET /data` - Pregled pohranjenih podataka

## Project Structure

```
SnapNStore/
├── src/
│   ├── index.js          # Glavna aplikacijska datoteka
│   ├── ocrProcessor.js   # OCR obrada podataka
│   └── csvExporter.js    # CSV export funkcionalnost
├── public/
│   ├── index.html        # Frontend HTML
│   ├── style.css         # CSS stilovi
│   └── script.js         # JavaScript logika
├── data/                 # Direktorij za pohranu podataka
├── package.json          # Projektne ovisnosti
└── README.md            # Dokumentacija
```

## Dependencies

- Express.js - Web framework
- Multer - File upload middleware
- Tesseract.js - OCR library
- @google/generative-ai - Google AI integration
- csv-writer - CSV export
- dotenv - Environment variable management

## License

MIT License

## Contributing

1. Forkajte repozitorij
2. Kreirajte feature branch (`git checkout -b feature/AmazingFeature`)
3. Commitajte vaše promjene (`git commit -m 'Add some AmazingFeature'`)
4. Pushajte na branch (`git push origin feature/AmazingFeature`)
5. Otvorite Pull Request