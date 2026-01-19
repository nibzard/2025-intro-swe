import { createWorker } from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';

class OCRService {
  constructor() {
    this.geminiApiKey = "AIzaSyCJS1qZZztzlfOp1G-ryCghJAiMvI8VLxc";
    this.useGemini = !!this.geminiApiKey && this.geminiApiKey !== 'vaš_ključ_ovdje';
    
    if (this.useGemini) {
      console.log('🧠 Gemini AI: SPREMAN (koristi se upisani ključ)');
    } else {
      console.log('🧠 Gemini AI: NIJE KONFIGURIRAN (Koristi se Tesseract)');
    }
  }

  async recognizeWithTesseract(imagePath) {
    try {
      const worker = await createWorker('hrv+eng');
      const { data: { text } } = await worker.recognize(imagePath);
      await worker.terminate();
      return text;
    } catch (error) {
      throw new Error(`Tesseract OCR greška: ${error.message}`);
    }
  }

  async recognizeWithGemini(imagePath) {
    if (!this.geminiApiKey) {
      throw new Error('GEMINI_API_KEY nije postavljen');
    }
    try {
      const genAI = new GoogleGenerativeAI(this.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const imageBuffer = readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      const prompt = `Analiziraj ovu sliku HRVATSKOG FISKALNOG RAČUNA i izvuci podatke.
Račun je strukturiran u STUPCIMA. Svi nazivi artikala su u jednom stupcu, a sve cijene u drugom.

VAŽNO: Odgovori ISKLJUČIVO u čistom JSON formatu.

Struktura JSON-a:
{
  "storeName": "Točan naziv trgovine",
  "date": "Datum u formatu DD.MM.YYYY",
  "time": "Vrijeme u formatu HH:MM:SS",
  "amount": 0.00, // UKUPNI iznos za platiti u EUR
  "paymentMethod": "Gotovina" ili "Kartica",
  "items": [
    {
      "name": "ČISTI NAZIV PROIZVODA",
      "quantity": 1.00,
      "price": 0.00,
      "total": 0.00
    }
  ]
}

STROGA PRAVILA ZA STAVKE (items):
1. Naziv proizvoda (name) smije sadržavati SAMO ime proizvoda.
2. OBAVEZNO IZBACI mjerne jedinice iz naziva (kg, L, lit, g, kom, komada, pak).
3. OBAVEZNO IZBACI količine i cijene iz naziva (npr. ako piše "KRUH 1.00", rezultat mora biti samo "KRUH").
4. Ako su podaci u stupcima, pažljivo poveži naziv artikla sa cijenom koja je u istom redu u susjednom stupcu.

PRAVILA ZA IZNOS (amount):
1. Traži "UKUPNO EUR" ili "ZA PLATITI".
2. IGNORIRAJ datume (npr. 21.02) kod traženja ukupnog iznosa. Ukupni iznos je obično najveći i najuočljiviji broj pri dnu.`;

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg'
          }
        },
        prompt
      ]);
      const response = await result.response;
      let text = response.text().trim();
      
      console.log('--- RAW AI RESPONSE START ---');
      console.log(text);
      console.log('--- RAW AI RESPONSE END ---');

      // Čišćenje ako AI doda markdown ili bilo što što nije JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }
      
      try {
        const parsed = JSON.parse(text);
        console.log('✅ AI podaci uspješno dekodirani.');
        return parsed;
      } catch (e) {
        console.error('❌ Gemini nije vratio ispravan JSON:', e.message);
        return text;
      }
    } catch (error) {
      throw new Error(`Gemini OCR greška: ${error.message}`);
    }
  }

  async recognizeText(imagePath) {
    // Ako ključ nije postavljen u konstruktoru, pokušaj iz env
    if (!this.geminiApiKey || this.geminiApiKey === 'vaš_ključ_ovdje') {
      this.geminiApiKey = process.env.GEMINI_API_KEY;
    }
    
    this.useGemini = !!this.geminiApiKey && this.geminiApiKey !== 'vaš_ključ_ovdje' && this.geminiApiKey !== '';

    if (this.useGemini) {
      console.log('🚀 Pokrećem Google Gemini AI za analizu računa...');
      try {
        const result = await this.recognizeWithGemini(imagePath);
        return result;
      } catch (error) {
        console.warn('⚠️ Gemini AI nije uspio, vraćam se na Tesseract:', error.message);
        return await this.recognizeWithTesseract(imagePath);
      }
    } else {
      console.log('ℹ️ Gemini API ključ nije pronađen ili je neispravan. Koristim lokalni Tesseract OCR...');
      if (!this.geminiApiKey) {
        console.log('   (Savjet: Provjerite GEMINI_API_KEY u .env datoteci)');
      }
      return await this.recognizeWithTesseract(imagePath);
    }
  }
}

export default OCRService;
