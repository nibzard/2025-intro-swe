class DataParser {
  parseReceiptData(text) {
    if (!text) return { items: [] };
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const currency = this.extractCurrency(text);
    const items = this.extractItemsStrict(lines);

    // OSIGURAJ DA SVAKI ARTIKL IMA VALUTU RAČUNA
    const itemsWithCurrency = items.map(item => ({
      ...item,
      currency: currency
    }));

    return {
      date: this.extractDate(text),
      time: this.extractTime(text),
      amount: this.extractAmount(lines),
      currency: currency,
      storeName: this.extractStoreName(lines),
      paymentMethod: this.extractPaymentMethod(text),
      items: itemsWithCurrency
    };
  }

  extractItemsStrict(lines) {
    const items = [];
    let inItemsSection = false;
    const headerKeywords = ['NAZIV', 'ARTIKL', 'STAVKA', 'PROIZVOD', 'OPIS'];
    const footerKeywords = ['UKUPNO', 'ZA PLATITI', 'SVEGA', 'GOTOVINA', 'POREZ', 'PDV', 'POT', 'POPUST', 'UKUPNO EUR'];

    let currentItem = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const upperLine = line.toUpperCase().trim();

      if (!inItemsSection) {
        if (headerKeywords.some(k => upperLine.includes(k))) {
          inItemsSection = true;
          continue;
        }
        continue;
      }

      if (footerKeywords.some(k => upperLine.startsWith(k) || upperLine === k)) break;
      if (line.includes('---') || line.length < 2) continue;

      const prices = line.match(/(\d+[.,]\d{2})(?!\d)/g);
      const hasPrice = !!prices;
      
      // Detekcija "detaljnog" retka (npr. "1,000 x 70,00 C-")
      const isDetailsLine = line.includes(' x ') || (line.includes(',') && line.match(/\b\d+,\d{3}\b/));

      const cleanLine = line
        .replace(/\b\d+,\d{3}\b/g, '') // Ukloni količine tipa 1,000
        .replace(/\bKOM\b/gi, '')
        .replace(/\b\d+x\b/gi, '')
        .replace(/\s+x\s+/gi, '')
        .replace(/(\d+[.,]\d{2})/g, '')
        .replace(/[A-E][+-]/g, '') // Ukloni porezne grupe tipa C- ili E+
        .replace(/^\d+\s+/, '')
        .trim();

      const hasRealLetters = /[a-zA-ZČĆŠĐŽ]/.test(cleanLine) && cleanLine.length > 2;

      if (hasRealLetters && !this.isTechnicalWord(cleanLine) && !isDetailsLine) {
        currentItem = { name: cleanLine.toLowerCase(), price: 0 };
        if (hasPrice) {
          currentItem.price = parseFloat(prices[prices.length - 1].replace(',', '.'));
        }
        items.push(currentItem);
      } else if (currentItem && hasPrice) {
        // Ako redak sadrži cijenu, a nemamo novi naziv, pripiši cijenu zadnjem artiklu
        // Uzimamo zadnju cijenu u retku jer je to obično ukupni iznos za taj artikl
        const newPrice = parseFloat(prices[prices.length - 1].replace(',', '.'));
        // Ako je trenutna cijena 0 ili je nova cijena veća, updateaj (često je u idućem redu pravi total)
        if (currentItem.price === 0 || newPrice >= currentItem.price) {
          currentItem.price = newPrice;
        }
      }
    }
    return items.filter(it => it.price > 0);
  }

  isTechnicalWord(word) {
    const blackList = ['DATUM', 'VRIJEME', 'OIB', 'RAČUN', 'HVALA', 'POPUST', 'STOPA', 'OSNOVICA', 'POT', 'PDV', 'GOTOVINA', 'KN', 'EUR', 'HRK', 'KUN', 'STAVKE', 'CIJENA', 'IZNOS', 'OPERATER', 'PRODAVAČ', 'BROJ', 'STOL', 'RN:', 'JIR', 'ZKI', 'KOPIJA'];
    return blackList.some(b => word.toUpperCase().includes(b));
  }

  extractAmount(lines) {
    let candidates = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toUpperCase();
      const isHeader = line.includes('CIJENA') || line.includes('KOL') || line.includes('NAZIV');
      if ((line.includes('UKUPNO') || line.includes('SVEGA') || line.includes('ZA PLATITI')) && !isHeader) {
        for (let j = 0; j <= 4; j++) {
          const checkLine = (lines[i + j] || "");
          const m = checkLine.match(/(\d+[.,]\d{2})/g);
          if (m) {
            m.forEach(match => {
              candidates.push({
                val: parseFloat(match.replace(',', '.')),
                priority: (line.includes('EUR') || checkLine.toUpperCase().includes('EUR')) ? 2 : 1
              });
            });
          }
        }
      }
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.priority - a.priority || b.val - a.val);
    return candidates[0].val;
  }

  extractCurrency(text) {
    const upperText = text.toUpperCase();
    const lines = text.split('\n');
    
    // 1. Provjera datuma - najpouzdaniji način za stare HR račune
    const date = this.extractDate(text);
    if (date !== 'N/A') {
      const parts = date.split('.');
      const yearStr = parts[parts.length - 1].trim();
      const year = parseInt(yearStr.length === 2 ? "20" + yearStr : yearStr);
      if (year > 1990 && year < 2023) {
        return 'KN';
      }
    }

    // 2. Traži KN oznake (agresivno)
    const knKeywords = [' KN', ' HRK', ' KUN', ' RN', ' KM', ' KN:'];
    if (knKeywords.some(k => upperText.includes(k))) {
        // Ako vidimo i EUR i KN, a KN je uz UKUPNO, vrati KN
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].toUpperCase();
            if (line.includes('UKUPNO') || line.includes('SVEGA') || line.includes('PLATITI')) {
                if (knKeywords.some(k => line.includes(k))) return 'KN';
                if (line.includes(' EUR')) return 'EUR';
            }
        }
        return 'KN';
    }
    
    if (upperText.includes(' £') || upperText.includes(' GBP')) return 'GBP';
    if (upperText.includes(' $') || upperText.includes(' USD')) return 'USD';
    
    return 'EUR'; 
  }

  extractStoreName(lines) {
    const brands = ['VICTA', 'MANDY', 'FARABUTO', 'KONZUM', 'LIDL', 'TOMMY', 'SPAR', 'PLODINE'];
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const l = lines[i].toUpperCase();
      // Provjeri brendove
      if (brands.some(b => l.includes(b))) return lines[i];
      // Provjeri CAFFE ili BAR
      if (l.includes('CAFFE') || l.includes('BAR') || l.includes('TRAJEKT')) {
        // Ako je linija prekratka ili sadrži samo CAFFE BAR, spoji s idućom
        if (l.length <= 15 && i + 1 < lines.length) {
          const nextL = lines[i+1];
          if (/[a-zA-Z]/.test(nextL) && nextL.length > 2 && !nextL.includes(':')) {
            return lines[i] + ' ' + nextL;
          }
        }
        return lines[i];
      }
    }
    const addressKeywords = ['ULICA', 'CESTA', 'TRG', 'PUT', 'MAKARSKA', 'ZVONIMIROVA', 'TURION', 'SPLIT', 'ZAGREB'];
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const l = lines[i];
      const isAddress = addressKeywords.some(k => l.toUpperCase().includes(k));
      if (l.length > 4 && !l.includes(':') && !l.includes('OIB') && !isAddress && /[a-zA-Z]/.test(l)) {
        return l;
      }
    }
    return lines[0] || 'Nepoznata Trgovina';
  }

  extractDate(text) {
    const m = text.match(/(\d{2}\s*\.\s*\d{2}\s*\.\s*\d{2,4})/);
    if (m) return m[1].replace(/\s+/g, '');
    return 'N/A';
  }

  extractTime(text) {
    const m = text.match(/(\d{2}:\d{2})/);
    return m ? m[1] : 'N/A';
  }

  extractPaymentMethod(text) {
    const lower = text.toLowerCase();
    if (lower.includes('gotovina') || lower.includes('novčanice')) return 'Gotovina';
    if (lower.includes('kartica') || lower.includes('visa') || lower.includes('master')) return 'Kartica';
    return 'Gotovina';
  }
}

export default DataParser;
