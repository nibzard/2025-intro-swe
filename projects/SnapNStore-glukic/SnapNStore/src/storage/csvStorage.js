import { createObjectCsvWriter } from 'csv-writer';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CSV_PATH = process.env.CSV_PATH || join(__dirname, '../../data/receipts.csv');

class CSVStorage {
  constructor() {
    this.csvPath = CSV_PATH;
    this.ensureFileExists();
  }

  ensureFileExists() {
    const csvDir = dirname(this.csvPath);
    if (!existsSync(csvDir)) {
      mkdirSync(csvDir, { recursive: true });
    }
    if (!existsSync(this.csvPath)) {
      const header = 'ID,Datum,Iznos,Trgovina,Artikli,Slika,Prepoznati tekst,Datum unosa\n';
      writeFileSync(this.csvPath, header, 'utf8');
    }
  }

  getAllReceipts() {
    try {
      const content = readFileSync(this.csvPath, 'utf8');
      const lines = content.trim().split('\n');
      if (lines.length <= 1) {
        return [];
      }

      const receipts = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim()) {
          const parts = this.parseCSVLine(line);
          let id, date, amount, storeName, items, imagePath, rawText, createdAt;
          
          if (parts.length === 7) {
            [id, date, amount, storeName, imagePath, rawText, createdAt] = parts;
            items = '[]';
          } else {
            [id, date, amount, storeName, items, imagePath, rawText, createdAt] = parts;
          }
          
          let parsedItems = [];
          try {
            parsedItems = items ? JSON.parse(items) : [];
          } catch (e) {
            parsedItems = [];
          }
          
          receipts.push({
            id: parseInt(id) || i,
            date: date || 'N/A',
            amount: parseFloat(amount) || 0,
            store_name: storeName || 'N/A',
            items: parsedItems,
            image_path: imagePath || null,
            raw_text: rawText || null,
            created_at: createdAt || new Date().toISOString()
          });
        }
      }

      return receipts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      console.error('Greška pri čitanju CSV-a:', error);
      return [];
    }
  }

  saveReceipt(receipt) {
    try {
      const receipts = this.getAllReceipts();
      
      if (receipt.imagePath && existsSync(receipt.imagePath)) {
        const duplicateByImage = receipts.find(r => {
          if (!r.image_path) return false;
          if (r.image_path === receipt.imagePath) return true;
          try {
            if (existsSync(r.image_path) && existsSync(receipt.imagePath)) {
              const hash1 = createHash('md5').update(readFileSync(r.image_path)).digest('hex');
              const hash2 = createHash('md5').update(readFileSync(receipt.imagePath)).digest('hex');
              return hash1 === hash2;
            }
          } catch (e) {}
          return false;
        });
        
        if (duplicateByImage) {
          return duplicateByImage.id;
        }
      }
      
      if (receipt.rawText) {
        const receiptTextHash = createHash('md5').update(receipt.rawText).digest('hex');
        const duplicateByText = receipts.find(r => {
          if (!r.raw_text) return false;
          const existingTextHash = createHash('md5').update(r.raw_text).digest('hex');
          return existingTextHash === receiptTextHash;
        });
        
        if (duplicateByText) {
          return duplicateByText.id;
        }
      }
      
      const isDuplicate = receipts.some(r => {
        const dateMatch = (r.date === receipt.date) || 
                         (r.date === 'N/A' && receipt.date === 'N/A');
        const amountMatch = Math.abs((r.amount || 0) - (receipt.amount || 0)) < 0.01;
        return dateMatch && amountMatch;
      });
      
      if (isDuplicate) {
        const existing = receipts.find(r => {
          const dateMatch = (r.date === receipt.date) || 
                           (r.date === 'N/A' && receipt.date === 'N/A');
          const amountMatch = Math.abs((r.amount || 0) - (receipt.amount || 0)) < 0.01;
          return dateMatch && amountMatch;
        });
        return existing ? existing.id : null;
      }
      
      const nextId = receipts.length > 0 ? Math.max(...receipts.map(r => r.id)) + 1 : 1;
      const itemsJson = JSON.stringify(receipt.items || []);
      
      const newReceipt = {
        id: nextId,
        date: receipt.date || 'N/A',
        amount: receipt.amount || 0,
        store_name: receipt.storeName || 'N/A',
        items: itemsJson,
        image_path: receipt.imagePath || '',
        raw_text: receipt.rawText || '',
        created_at: new Date().toISOString()
      };

      const line = this.formatCSVLine([
        newReceipt.id,
        newReceipt.date,
        newReceipt.amount,
        newReceipt.store_name,
        newReceipt.items,
        newReceipt.image_path,
        newReceipt.raw_text,
        newReceipt.created_at
      ]);

      writeFileSync(this.csvPath, line + '\n', { flag: 'a', encoding: 'utf8' });
      return newReceipt.id;
    } catch (error) {
      console.error('Greška pri spremanju u CSV:', error);
      throw error;
    }
  }

  searchByStore(storeName) {
    const receipts = this.getAllReceipts();
    const searchTerm = storeName.toLowerCase();
    return receipts.filter(r => 
      r.store_name.toLowerCase().includes(searchTerm)
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  searchByDate(date) {
    const receipts = this.getAllReceipts();
    return receipts.filter(r => r.date === date)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getReceiptById(id) {
    const receipts = this.getAllReceipts();
    return receipts.find(r => r.id === parseInt(id));
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  formatCSVLine(fields) {
    return fields.map(field => {
      const str = String(field || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',');
  }

  deleteAllReceipts() {
    try {
      const header = 'ID,Datum,Iznos,Trgovina,Artikli,Slika,Prepoznati tekst,Datum unosa\n';
      writeFileSync(this.csvPath, header, 'utf8');
      return true;
    } catch (error) {
      console.error('Greška pri brisanju računa:', error);
      throw error;
    }
  }
}

export default CSVStorage;
