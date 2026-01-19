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
      const ocrResult = await this.ocrService.recognizeText(imagePath);
      
      if (!ocrResult) {
        throw new Error('OCR nije uspio dohvatiti podatke');
      }

      let extractedData;
      let rawText = '';

      // Ako je ocrResult već objekt (od Gemini-a), koristi ga direktno
      if (typeof ocrResult === 'object' && ocrResult !== null && !Array.isArray(ocrResult)) {
        console.log('✅ Gemini AI je uspješno strukturirao podatke.');
        extractedData = ocrResult;
        rawText = JSON.stringify(ocrResult);
      } else {
        // Ako je ocrResult tekst (od Tesseract-a), koristi parser
        console.log('📝 Analiziram tekst pomoću lokalnih pravila...');
        rawText = ocrResult;
        extractedData = this.parser.parseReceiptData(rawText);
      }
      
      console.log('Izdvojeni podaci:', extractedData);

      const receiptData = {
        date: extractedData.date || 'N/A',
        time: extractedData.time || 'N/A',
        amount: extractedData.amount || 0,
        storeName: extractedData.storeName || 'N/A',
        paymentMethod: extractedData.paymentMethod || 'N/A',
        items: extractedData.items || [],
        imagePath: imagePath,
        rawText: rawText
      };
      
      // Fallback ako iznos nije prepoznat, a imamo sirovi tekst
      if ((!receiptData.amount || receiptData.amount === 0) && typeof ocrResult === 'string') {
        const fallbackAmount = this.parser.extractAmount(rawText);
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
}

export default ReceiptService;
