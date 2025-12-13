import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import dotenv from 'dotenv';
import ReceiptService from './services/receiptService.js';
import CSVExporter from './utils/csvExporter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const uploadsDir = join(__dirname, '../uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Samo slike su dozvoljene (JPEG, PNG, GIF)'));
    }
  }
});

const receiptService = new ReceiptService();
const csvExporter = new CSVExporter();

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

app.post('/api/receipts/process', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nijedna slika nije učitana' });
    }

    const imagePath = req.file.path;
    console.log('Primljena slika:', imagePath);
    
    const result = await receiptService.processReceipt(imagePath);
    
    console.log('Rezultat obrade:', result);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Greška u API endpointu:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Nepoznata greška pri obradi računa' 
    });
  }
});

app.get('/api/receipts', (req, res) => {
  const receipts = receiptService.getAllReceipts();
  res.json({ success: true, receipts, count: receipts.length });
});

app.get('/api/receipts/search', (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ success: false, error: 'Query parametar "q" je obavezan' });
  }

  const receipts = receiptService.searchReceipts(query);
  res.json({ success: true, receipts, count: receipts.length, query });
});

app.get('/api/receipts/export', async (req, res) => {
  try {
    const receipts = receiptService.getAllReceipts();
    const csvPath = await csvExporter.exportToCSV(receipts);
    
    res.json({ 
      success: true, 
      message: 'CSV datoteka kreirana',
      path: csvPath,
      count: receipts.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/receipts/delete-all', (req, res) => {
  try {
    receiptService.deleteAllReceipts();
    res.json({ 
      success: true, 
      message: 'Svi računi su izbrisani'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server pokrenut na http://localhost:${PORT}`);
  console.log(`📁 Upload direktorij: ${uploadsDir}`);
  console.log(`💾 CSV datoteka: ${process.env.CSV_PATH || './data/receipts.csv'}`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Zatvaram aplikaciju...');
  process.exit(0);
});
