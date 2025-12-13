import { createObjectCsvWriter } from 'csv-writer';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CSVExporter {
  async exportToCSV(receipts, outputPath = null) {
    const exportDir = join(__dirname, '../../exports');
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true });
    }
    if (!outputPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      outputPath = join(exportDir, `receipts_${timestamp}.csv`);
    }
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'date', title: 'Datum' },
        { id: 'amount', title: 'Iznos' },
        { id: 'store_name', title: 'Trgovina' },
        { id: 'created_at', title: 'Datum unosa' }
      ]
    });
    const csvData = receipts.map(receipt => ({
      id: receipt.id,
      date: receipt.date,
      amount: receipt.amount,
      store_name: receipt.store_name,
      created_at: receipt.created_at
    }));
    await csvWriter.writeRecords(csvData);
    console.log(`CSV datoteka kreirana: ${outputPath}`);
    return outputPath;
  }
}

export default CSVExporter;
