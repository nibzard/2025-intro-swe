import { GoogleGenerativeAI } from '@google/generative-ai';
import vision from '@google-cloud/vision';

class OCRService {
  constructor() {
    try {
      const googleConfig = {};
      
      // Ako imamo cijeli JSON u okolišnoj varijabli (za Vercel)
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        googleConfig.credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      } 
      // Inače koristimo datoteku (lokalno)
      else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // vision klijent će sam potražiti datoteku na putanji iz ove varijable
      }

      this.visionClient = new vision.ImageAnnotatorClient(googleConfig);
    } catch (e) {
      console.log('👁️ Vision Client nije spreman. Provjerite API ključeve.');
    }
  }

  async recognizeWithVision(imagePath) {
    try {
      const [result] = await this.visionClient.textDetection(imagePath);
      const rawText = result.textAnnotations[0]?.description || null;
      if (rawText) {
        console.log('--- RAW OCR TEXT START ---');
        console.log(rawText);
        console.log('--- RAW OCR TEXT END ---');
      }
      return rawText;
    } catch (error) {
      console.error('❌ Vision Error:', error.message);
      return null;
    }
  }

  async structureTextWithGemini(rawText, apiKey) {
    if (!apiKey) return null;
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Koristimo model sa sustavskim uputama za maksimalnu preciznost
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "Ti si stručnjak za hrvatske fiskalne račune. Tvoj zadatak je izvući podatke i vratiti ih isključivo u JSON formatu."
      });

      const prompt = `Izvuci podatke iz ovog OCR teksta računa i vrati JSON:
      {
        "storeName": "Točno ime trgovine ili kafića (npr. VICTA ili Caffe bar MANDY)",
        "date": "DD.MM.YYYY",
        "time": "HH:MM",
        "amount": broj_ukupnog_iznosa,
        "currency": "KN ili EUR",
        "paymentMethod": "Gotovina ili Kartica",
        "items": [{"name": "pun naziv artikla", "price": ukupna_cijena_artikla}]
      }

      Pravila:
      1. Polje 'currency' mora biti 'EUR', 'KN' ili druga valuta detektirana na računu.
      2. Prioritet valute: Koristi valutu koja je navedena uz GLAVNI UKUPNI IZNOS (Total).
      3. Ako je račun izdan prije 2023. godine, a navedeni su i KN i EUR, obavezno koristi KN kao primarnu valutu.
      4. Artikli su između riječi 'NAZIV' i 'UKUPNO'.
      5. Ignoriraj 'KOM', kolićine (1x, 2,00) i poreze.
      6. Polje 'price' u artiklima je UKUPAN IZNOS za taj artikl. Navedi ga u istoj valuti kao i 'currency'.

      Tekst računa:
      ${rawText}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Čišćenje odgovora od markdowna ako ga AI doda
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Gemini uspješno strukturirao podatke.');
        
        // OSIGURAJ DA SU ARTIKLI U ISTOJ VALUTI KAO RAČUN
        if (parsed.items && parsed.currency) {
          parsed.items = parsed.items.map(item => ({
            ...item,
            currency: parsed.currency
          }));
        }
        
        return parsed;
      }
      return null;
    } catch (e) {
      console.log('⚠️ Gemini greška:', e.message);
      return null;
    }
  }

  async recognizeText(imagePath) {
    const apiKey = process.env.GEMINI_API_KEY;
    const rawText = await this.recognizeWithVision(imagePath);
    
    if (rawText) {
      console.log('✅ Vision OCR uspješan.');
      const structured = await this.structureTextWithGemini(rawText, apiKey);
      
      // Vraćamo i strukturirane podatke i originalni tekst
      return {
        structured: structured,
        rawText: rawText
      };
    }
    return null;
  }
}

export default OCRService;
