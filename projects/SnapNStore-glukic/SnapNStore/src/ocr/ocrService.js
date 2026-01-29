import { createWorker } from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';

class OCRService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.useGemini = !!this.geminiApiKey;
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
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const imageBuffer = readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const prompt = `Prepoznaj i vrati SAV tekst s ove slike računa. 
Ovo je hrvatski račun (račun za kupnju). 
Vrati tekst točno kako se pojavljuje na računu, uključujući:
- Naziv trgovine/kompanije (obično na vrhu)
- Datum i vrijeme (format DD.MM.YYYY HH:MM:SS)
- Iznos (traži "UKUPNO EUR" ili "UKUPNO" s iznosom)
- Sve ostale informacije

Vrati samo tekst, bez dodatnih komentara ili objašnjenja.`;
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg'
          }
        }
      ]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Gemini OCR greška: ${error.message}`);
    }
  }

  async recognizeText(imagePath) {
    if (this.useGemini) {
      console.log('Koristim Gemini za OCR...');
      return await this.recognizeWithGemini(imagePath);
    } else {
      console.log('Koristim Tesseract za OCR...');
      return await this.recognizeWithTesseract(imagePath);
    }
  }
}

export default OCRService;
