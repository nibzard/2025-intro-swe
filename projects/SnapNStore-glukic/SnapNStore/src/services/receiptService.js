import OCRService from '../ocr/ocrService.js';
import DataParser from '../parser/dataParser.js';
import CSVStorage from '../storage/csvStorage.js';

class ReceiptService {
  constructor() {
    this.ocrService = new OCRService();
    this.parser = new DataParser();
    this.storage = new CSVStorage();
  }

  async processReceipt(imagePath) {
    try {
      console.log('Prepoznavanje teksta s računa...');
      const rawText = await this.ocrService.recognizeText(imagePath);
      
      if (!rawText || rawText.trim().length === 0) {
        throw new Error('OCR nije uspio prepoznati tekst s slike');
      }

      console.log('Prepoznati tekst (prvih 500 znakova):', rawText.substring(0, 500));

      console.log('Izdvajanje podataka...');
      const extractedData = this.parser.parseReceiptData(rawText);
      
      console.log('Izdvojeni podaci:', extractedData);

      const validation = this.parser.validateData(extractedData);
      if (!validation.isValid) {
        console.warn('Upozorenja pri validaciji:', validation.errors);
        console.log('Izdvojeni podaci prije spremanja:', extractedData);
      }

      const receiptData = {
        date: extractedData.date || 'N/A',
        amount: extractedData.amount || 0,
        storeName: extractedData.storeName || 'N/A',
        items: extractedData.items || [],
        imagePath: imagePath,
        rawText: rawText
      };
      
      if (receiptData.items.length > 0) {
        console.log('Pronađeni artikli:', receiptData.items);
      } else {
        console.log('Nisu pronađeni artikli na računu');
      }

      if (!receiptData.amount || receiptData.amount === 0) {
        console.log('Iznos nije pronađen, pokušavam alternativne metode...');
        const amountMatch = rawText.match(/(\d+[.,]\d{2})\s*(?:EUR|€|kn|HRK|UKUPNO)/i);
        if (amountMatch) {
          receiptData.amount = parseFloat(amountMatch[1].replace(',', '.'));
          console.log('Pronađen alternativni iznos:', receiptData.amount);
        }
      }

      const receiptId = this.storage.saveReceipt(receiptData);
      console.log('Račun spremljen s ID:', receiptId);

      return {
        success: true,
        receiptId,
        data: receiptData,
        validation
      };
    } catch (error) {
      console.error('Greška pri obradi računa:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getAllReceipts() {
    return this.storage.getAllReceipts();
  }

  searchReceipts(query) {
    const byStore = this.storage.searchByStore(query);
    if (byStore.length > 0) {
      return byStore;
    }
    const byDate = this.storage.searchByDate(query);
    return byDate;
  }

  getReceiptById(id) {
    return this.storage.getReceiptById(id);
  }

  deleteAllReceipts() {
    return this.storage.deleteAllReceipts();
  }
}

export default ReceiptService;
