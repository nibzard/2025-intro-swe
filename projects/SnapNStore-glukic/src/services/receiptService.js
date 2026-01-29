import OCRService from '../ocr/ocrService.js';
import DataParser from '../parser/dataParser.js';
import LocalDatabase from '../storage/localDatabase.js';

class ReceiptService {
  constructor() {
    this.ocrService = new OCRService();
    this.parser = new DataParser();
    this.storage = new LocalDatabase();
  }

  async processReceipt(imagePath) {
    try {
      console.log('Prepoznavanje podataka s računa...');
      const ocrResponse = await this.ocrService.recognizeText(imagePath);
      
      if (!ocrResponse || !ocrResponse.rawText) {
        throw new Error('OCR nije uspio dohvatiti podatke');
      }

      const { structured, rawText } = ocrResponse;
      let extractedData;

      if (structured) {
        console.log('✅ Gemini AI je uspješno strukturirao podatke.');
        extractedData = structured;
      } else {
        console.log('📝 Analiziram tekst pomoću lokalnih pravila...');
        extractedData = this.parser.parseReceiptData(rawText);
      }
      
      console.log('Izdvojeni podaci:', extractedData);

      // Ključno: Ako valuta nije prepoznata ili je defaultna, prisili provjeru iz rawText-a
      let currency = extractedData.currency;
      let receiptYear = 0;
      
      if (extractedData.date && extractedData.date !== 'N/A') {
        const parts = extractedData.date.split('.');
        const yearStr = parts[parts.length - 1].trim();
        receiptYear = parseInt(yearStr);
        if (receiptYear < 100) receiptYear += 2000; // Pretvori 12 u 2012
        
        if (receiptYear > 1990 && receiptYear < 2023) {
          currency = 'KN'; // Prisili KN za stare račune bez obzira na sve
        }
      }

      if (!currency || currency === 'EUR' || currency === 'N/A') {
        const detectedCurrency = this.parser.extractCurrency(rawText);
        if (detectedCurrency) {
          currency = detectedCurrency;
        } else {
          // Ako baš ništa ne nađemo, provjeri opet godinu za svaki slučaj
          currency = (receiptYear > 1990 && receiptYear < 2023) ? 'KN' : 'EUR';
        }
      }

      const receiptData = {
        date: extractedData.date || 'N/A',
        time: extractedData.time || 'N/A',
        amount: extractedData.amount || 0,
        currency: currency,
        storeName: extractedData.storeName || 'N/A',
        paymentMethod: extractedData.paymentMethod || 'N/A',
        items: extractedData.items || [],
        imagePath: imagePath,
        rawText: rawText
      };
      
      // Osiguraj da svi artikli imaju istu valutu kao i cijeli račun
      if (receiptData.items && receiptData.items.length > 0) {
        receiptData.items = receiptData.items.map(item => ({
          ...item,
          currency: currency // Svaki artikl nasljeđuje valutu računa
        }));
      }

      // Fallback ako iznos nije prepoznat
      if ((!receiptData.amount || receiptData.amount === 0)) {
        const fallbackAmount = this.parser.extractAmount(rawText.split('\n'));
        if (fallbackAmount) receiptData.amount = fallbackAmount;
      }

      const receiptId = await this.storage.saveReceipt(receiptData);
      console.log('Račun spremljen s ID:', receiptId);

      return {
        success: true,
        receiptId,
        data: receiptData
      };
    } catch (error) {
      console.error('Greška pri obradi računa:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAllReceipts() {
    return await this.storage.getAllReceipts();
  }

  async searchReceipts(query) {
    const byStore = await this.storage.searchByStore(query);
    if (byStore.length > 0) {
      return byStore;
    }
    const byDate = await this.storage.searchByDate(query);
    return byDate;
  }

  async getReceiptById(id) {
    return await this.storage.getReceiptById(id);
  }

  async deleteAllReceipts() {
    return await this.storage.deleteAllReceipts();
  }

  async deleteReceipt(id) {
    return await this.storage.deleteReceipt(id);
  }
}

export default ReceiptService;
