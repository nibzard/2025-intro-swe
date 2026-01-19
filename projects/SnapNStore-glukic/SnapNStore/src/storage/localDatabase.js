import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../../data/database.json');

class LocalDatabase {
  constructor() {
    this.dbPath = DB_PATH;
    this.ensureDbExists();
  }

  ensureDbExists() {
    const dbDir = dirname(this.dbPath);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
    if (!existsSync(this.dbPath)) {
      const initialData = {
        receipts: [],
        settings: {
          lastUpdate: new Date().toISOString()
        }
      };
      writeFileSync(this.dbPath, JSON.stringify(initialData, null, 2), 'utf8');
    }
  }

  readData() {
    try {
      if (!existsSync(this.dbPath)) {
        this.ensureDbExists();
      }
      const content = readFileSync(this.dbPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Greška pri čitanju baze podataka:', error);
      return { receipts: [] };
    }
  }

  writeData(data) {
    try {
      writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Greška pri pisanju u bazu podataka:', error);
      return false;
    }
  }

  async getAllReceipts() {
    const data = this.readData();
    return data.receipts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  async saveReceipt(receipt) {
    const data = this.readData();
    const receipts = data.receipts;

    // Provjera duplikata po tekstu
    if (receipt.rawText) {
      const receiptTextHash = createHash('md5').update(receipt.rawText).digest('hex');
      const duplicate = receipts.find(r => {
        if (!r.raw_text) return false;
        const existingTextHash = createHash('md5').update(r.raw_text).digest('hex');
        return existingTextHash === receiptTextHash;
      });

      if (duplicate) return duplicate.id;
    }

    // Provjera duplikata po datumu i iznosu
    const duplicate = receipts.find(r => {
      const dateMatch = (r.date === receipt.date) || (r.date === 'N/A' && receipt.date === 'N/A');
      const amountMatch = Math.abs((r.amount || 0) - (receipt.amount || 0)) < 0.01;
      return dateMatch && amountMatch;
    });

    if (duplicate) return duplicate.id;

    const nextId = receipts.length > 0 ? Math.max(...receipts.map(r => r.id)) + 1 : 1;
    
    const newReceipt = {
      id: nextId,
      date: receipt.date || 'N/A',
      time: receipt.time || 'N/A',
      amount: receipt.amount || 0,
      store_name: receipt.storeName || 'N/A',
      payment_method: receipt.paymentMethod || 'N/A',
      items: receipt.items || [],
      image_path: receipt.imagePath || '',
      raw_text: receipt.rawText || '',
      created_at: new Date().toISOString()
    };

    data.receipts.push(newReceipt);
    this.writeData(data);
    
    return newReceipt.id;
  }

  async searchByStore(storeName) {
    const data = this.readData();
    const searchTerm = storeName.toLowerCase();
    return data.receipts.filter(r => 
      r.store_name.toLowerCase().includes(searchTerm)
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async searchByDate(date) {
    const data = this.readData();
    return data.receipts.filter(r => r.date === date)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  async getReceiptById(id) {
    const data = this.readData();
    return data.receipts.find(r => r.id === parseInt(id));
  }

  async deleteAllReceipts() {
    const data = this.readData();
    data.receipts = [];
    return this.writeData(data);
  }
}

export default LocalDatabase;
