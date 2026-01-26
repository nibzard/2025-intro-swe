import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

/**
 * Primjer skripte za korištenje SnapNStore API-ja
 * 
 * Za pokretanje ovog primjera potrebno je instalirati axios i form-data:
 * npm install axios form-data
 */

const API_URL = 'http://localhost:3000/api';

async function uploadReceipt(imagePath) {
  try {
    const form = new FormData();
    form.append('receipt', fs.createReadStream(imagePath));

    console.log('🚀 Slanje računa na obradu...');
    const response = await axios.post(`${API_URL}/receipts/process`, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    console.log('✅ Račun uspješno obrađen!');
    console.log('Podaci o računu:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Greška pri slanju računa:', error.response?.data || error.message);
  }
}

async function getReceipts() {
  try {
    console.log('📋 Dohvaćanje svih računa...');
    const response = await axios.get(`${API_URL}/receipts`);
    console.log(`Pronađeno ${response.data.count} računa.`);
    return response.data.receipts;
  } catch (error) {
    console.error('❌ Greška pri dohvaćanju računa:', error.message);
  }
}

async function searchReceipts(query) {
  try {
    console.log(`🔍 Pretraživanje računa za pojam: "${query}"...`);
    const response = await axios.get(`${API_URL}/receipts/search?q=${query}`);
    console.log(`Pronađeno ${response.data.count} rezultata.`);
    return response.data.receipts;
  } catch (error) {
    console.error('❌ Greška pri pretraživanju:', error.message);
  }
}

// Glavna funkcija
async function main() {
  // 1. Dohvati sve račune
  await getReceipts();

  // 2. Pretraži račune (ako postoje)
  await searchReceipts('Konzum');

  // Napomena: Za upload, osigurajte da putanja do slike postoji
  // const imagePath = path.join(process.cwd(), 'uploads', 'sample-receipt.jpg');
  // if (fs.existsSync(imagePath)) {
  //   await uploadReceipt(imagePath);
  // } else {
  //   console.log('\n💡 Za testiranje uploada, postavite sliku računa u uploads folder i odkomentirajte kod u main() funkciji.');
  // }
}

main();
