class DataParser {
  parseReceiptData(text) {
    const result = {
      date: this.extractDate(text),
      time: this.extractTime(text),
      amount: this.extractAmount(text),
      storeName: this.extractStoreName(text),
      paymentMethod: this.extractPaymentMethod(text),
      items: this.extractItems(text)
    };
    return result;
  }

  extractOIB(text) {
    const oibMatch = text.match(/OIB[:\s]*(\d{11})/i);
    return oibMatch ? oibMatch[1] : 'N/A';
  }

  extractTime(text) {
    const timeMatch = text.match(/(\d{2}:\d{2}:\d{2})/);
    return timeMatch ? timeMatch[1] : 'N/A';
  }

  extractPaymentMethod(text) {
    if (text.match(/gotovina/i)) return 'Gotovina';
    if (text.match(/kartic[ae]/i)) return 'Kartica';
    if (text.match(/transakcijski/i)) return 'Transakcijski račun';
    return 'N/A';
  }

  extractZKI(text) {
    const zkiMatch = text.match(/ZKI[:\s]*([a-f0-9]{32})/i);
    return zkiMatch ? zkiMatch[1].toUpperCase() : 'N/A';
  }

  extractJIR(text) {
    const jirMatch = text.match(/JIR[:\s]*([a-f0-9-]{36})/i);
    return jirMatch ? jirMatch[1] : 'N/A';
  }

  extractDate(text) {
    const datePatterns = [
      /\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2}/,
      /\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}/,
      /\d{2}\.\d{2}\.\d{4}/,
      /\d{1,2}\.\d{1,2}\.\d{4}/,
      /(?:datum|date)[:\s]*(\d{2}\.\d{2}\.\d{4})/i,
      /\d{2}\/\d{2}\/\d{4}/,
      /\d{4}-\d{2}-\d{2}/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        let date = match[1] || match[0];
        if (date.includes(' ')) {
          date = date.split(' ')[0];
        }
        if (date.includes('/')) {
          const parts = date.split('/');
          date = `${parts[0].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[2]}`;
        } else if (date.includes('-')) {
          const parts = date.split('-');
          date = `${parts[2]}.${parts[1]}.${parts[0]}`;
        } else if (date.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/)) {
          const parts = date.split('.');
          date = `${parts[0].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[2]}`;
        }
        const parts = date.split('.');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
            return date;
          }
        }
      }
    }
    return 'N/A';
  }

  extractAmount(text) {
    if (!text) return null;
    
    // Očisti tekst od datuma kako ne bismo čitali iznose iz njih (npr. 21.02.2024 -> izbjegni 21.02)
    const textWithoutDates = text.replace(/\d{1,2}\.\d{1,2}\.\d{4}/g, ' [DATE] ')
                                 .replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, ' [DATE] ');

    // 1. Primarni pokušaj: Specifični hrvatski iznosi
    const totalPatterns = [
      /UKUPNO\s+EUR[:\s]*(\d+[.,]\d{2})/i,
      /UKUPNO[:\s]*(\d+[.,]\d{2})\s*EUR/i,
      /IZNOS[:\s]*(\d+[.,]\d{2})/i,
      /PLAĆENO[:\s]*(\d+[.,]\d{2})/i,
      /ZA\s+PLATITI[:\s]*(\d+[.,]\d{2})/i,
    ];
    
    for (const pattern of totalPatterns) {
      const match = textWithoutDates.match(pattern);
      if (match) {
        const val = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(val)) return val;
      }
    }
    
    // 2. Sekundarni pokušaj: Traži sve što sliči na cijenu (globalno pretraživanje)
    const priceRegex = /(\d+[.,]\d{2})/g;
    const matches = textWithoutDates.match(priceRegex);
    
    if (matches && matches.length > 0) {
      const amounts = matches.map(m => parseFloat(m.replace(',', '.')))
                             .filter(a => a > 0 && a < 10000);
      if (amounts.length > 0) {
        return Math.max(...amounts);
      }
    }
    
    return null;
  }

  extractStoreName(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Često je OIB blizu naziva trgovine, pokušajmo ga naći
    let oibIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/OIB[:\s]*\d{11}/i)) {
        oibIndex = i;
        break;
      }
    }

    // Ako smo našli OIB, trgovina je obično 1-3 linije iznad
    if (oibIndex > 0) {
      for (let i = Math.max(0, oibIndex - 3); i < oibIndex; i++) {
        const line = lines[i].trim();
        if (this.isValidStoreName(line)) {
          return line;
        }
      }
    }

    // Originalna logika kao fallback
    if (lines.length > 0) {
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i].trim();
        if (this.isValidStoreName(line)) {
          if (line.match(/^[A-ZČĆŠĐŽ\s\.]+$/) && line.length >= 3 && line.length <= 30) {
            return line;
          }
          if (line.match(/^[A-ZČĆŠĐŽ][A-ZČĆŠĐŽa-zčćšđž\s\.]+$/) && line.length >= 3 && line.length <= 30) {
            return line;
          }
        }
      }
    }
    
    const contextPatterns = [
      /([A-ZČĆŠĐŽ][A-ZČĆŠĐŽa-zčćšđž\s\.]{3,30})\s+(?:SPLIT|OIB|PRODAVAONICA)/i,
      /(?:SPLIT|OIB|PRODAVAONICA)\s+([A-ZČĆŠĐŽ][A-ZČĆŠĐŽa-zčćšđž\s\.]{3,30})/i,
    ];
    
    for (const pattern of contextPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let storeName = match[1].trim();
        if (this.isValidStoreName(storeName)) {
          return storeName;
        }
      }
    }
    
    if (lines.length > 0) {
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i].trim();
        if (line.length >= 3 && 
            line.length <= 30 && 
            !this.isOCRError(line) &&
            !/^\d/.test(line) &&
            !line.match(/^(OIB|PDV|BLAGAJNA|RAČUN|Datum|Iznos|UKUPNO|SPLIT|PRODAVAONICA)/i)) {
          if (line.match(/[A-ZČĆŠĐŽ]/) && line.split(/\s+/).length <= 5) {
            return line;
          }
        }
      }
    }
    return 'N/A';
  }

  isOCRError(line) {
    if (line.match(/^[A-Z]\s+[A-Z]\s+[a-z]+\s+[a-z]+\s+[a-z]$/i)) return true;
    if (line.match(/^[A-Z]\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]$/i)) return true;
    if (line.match(/^[A-Z]\s+[A-Z]\s+[a-z]+\s+[a-z]$/i)) return true;
    if (line.split(/\s+/).length > 4 && line.length < 20) return true;
    if (line.match(/^[A-Z]\s+[A-Z]\s+[A-Z]/) && line.length < 15) return true;
    return false;
  }

  isValidStoreName(line) {
    if (!line || line.length < 3 || line.length > 60) return false;
    if (/^\d+/.test(line)) return false;
    if (/^\d{2}\.\d{2}\.\d{4}/.test(line)) return false;
    if (line.match(/^(OIB|PDV|BLAGAJNA|RAČUN|Datum|Iznos|UKUPNO|Vrijeme|SPLIT|PRODAVAONICA|DJELATNIK|Blagajna)/i)) return false;
    if (line.match(/^\d+[.,]\d{2}/)) return false;
    if (line.includes('BLAGAJNA') || line.includes('RAČUN BR') || line.includes('VRIJEME')) return false;
    if (this.isOCRError(line)) return false;
    return true;
  }

  extractItems(text) {
    const items = [];
    const lines = text.split('\n');
    let inItemsSection = false;
    let itemsStartIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/(?:naziv\s+artikla|artikl|proizvod)/i) && 
          (line.includes('Kol') || line.includes('Cijena') || line.includes('Iznos'))) {
        inItemsSection = true;
        itemsStartIndex = i + 1;
        continue;
      }
      if (inItemsSection && itemsStartIndex > 0 && i >= itemsStartIndex) {
        if (line.match(/(?:UKUPNO|PDV|PLACENO|Račun|Datum|ZKI|JIR|HVALA)/i)) {
          break;
        }
        const item = this.parseItemLine(line);
        if (item) {
          items.push(item);
        }
      }
    }
    
    if (items.length === 0) {
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 5 && 
            !trimmedLine.match(/(?:UKUPNO|PDV|PLACENO|Račun|Datum|OIB|BLAGAJNA|PRODAVAONICA)/i) &&
            trimmedLine.match(/\d+[.,]\d{2}/)) {
          const item = this.parseItemLine(trimmedLine);
          if (item && item.name.length > 2 && item.price > 0) {
            items.push(item);
          }
        }
      }
    }
    return items;
  }
  
  parseItemLine(line) {
    line = line.replace(/\s+/g, ' ').trim();
    if (line.length < 5) return null;

    // Isključi linije koje su očito zaglavlja ili dno računa
    if (line.match(/(?:UKUPNO|POPUST|PDV|Porez|RAČUN|HVALA|OIB|Datum|Blagajna|Prodavaonica)/i)) {
      return null;
    }

    // Format 1: "Naziv Artikli 0.5L 1,000 x 5,00 5,00" (Složeni hrvatski format)
    // Tražimo "broj x broj" bilo gdje u liniji
    const multiPattern = /^(.*?)\s+(\d+[.,]\d{0,3})\s*[x×*]\s*(\d+[.,]\d{2})\s+(\d+[.,]\d{2})$/i;
    const multiMatch = line.match(multiPattern);
    if (multiMatch) {
      return {
        name: this.cleanItemName(multiMatch[1]),
        quantity: parseFloat(multiMatch[2].replace(',', '.')),
        price: parseFloat(multiMatch[3].replace(',', '.')),
        total: parseFloat(multiMatch[4].replace(',', '.'))
      };
    }

    // Format 2: "Naziv Artikli 10,00" (Jednostavan format: naziv pa cijena na kraju)
    // Gledamo zadnji broj u liniji koji izgleda kao cijena
    const priceMatches = [...line.matchAll(/(\d+[.,]\d{2})/g)];
    if (priceMatches.length > 0) {
      const lastMatch = priceMatches[priceMatches.length - 1];
      const priceIndex = lastMatch.index;
      const namePart = line.substring(0, priceIndex).trim();
      const priceVal = parseFloat(lastMatch[0].replace(',', '.'));

      if (namePart.length > 2 && priceVal > 0 && priceVal < 5000) {
        return {
          name: this.cleanItemName(namePart),
          quantity: 1,
          price: priceVal,
          total: priceVal
        };
      }
    }

    return null;
  }

  // Pomoćna funkcija za čišćenje naziva (uklanja barkodove i nepotrebne brojeve s početka)
  cleanItemName(name) {
    return name
      .replace(/^\d{5,}\s+/, '') // Uklanja duge barkodove (5+ znamenki)
      .replace(/^[*\-]\s+/, '')   // Uklanja zvjezdice ili crtice na početku
      .replace(/\s+\d+[.,]\d{2,3}\s*$/, '') // Uklanja cijene na kraju naziva
      .replace(/\s+\d+\s*(?:kom|kg|l|lit|g|pak)\.?\s*$/i, '') // Uklanja "10 kom", "1 kg" na kraju
      .replace(/\s+(?:kom|kg|l|lit|g|pak)\.?\s+/i, ' ') // Uklanja mjerne jedinice u sredini
      .replace(/\s+(?:kom|kg|l|lit|g|pak)\.?$/i, '') // Uklanja mjerne jedinice na kraju
      .trim();
  }

  validateData(data) {
    const errors = [];
    if (data.date !== 'N/A' && !/^\d{2}\.\d{2}\.\d{4}$/.test(data.date)) {
      errors.push('Datum nije u ispravnom formatu (DD.MM.YYYY)');
    }
    if (data.amount === null || data.amount <= 0) {
      errors.push('Iznos mora biti pozitivan broj');
    }
    if (!data.storeName || data.storeName.trim().length === 0) {
      errors.push('Naziv trgovine ne smije biti prazan');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default DataParser;
