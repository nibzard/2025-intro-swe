class DataParser {
  parseReceiptData(text) {
    const result = {
      date: this.extractDate(text),
      amount: this.extractAmount(text),
      storeName: this.extractStoreName(text),
      items: this.extractItems(text)
    };
    return result;
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
    const totalPatterns = [
      /UKUPNO\s+EUR[:\s]*(\d+[.,]\d{2})/i,
      /UKUPNO\s+EUR\s*[:\s]*(\d+[.,]\d{2})/i,
      /UKUPNO[:\s]+(\d+[.,]\d{2})\s*EUR/i,
      /UKUPNO[:\s]*(\d+[.,]\d{2})/i,
    ];
    
    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        let amount = match[1] || match[0];
        amount = amount.replace(',', '.');
        const parsed = parseFloat(amount);
        if (!isNaN(parsed) && parsed > 0 && parsed < 1000000) {
          return parsed;
        }
      }
    }
    
    const allAmountPatterns = [
      /(?:ukupno|total|iznos|plaćeno|za\s+platiti)[:\s]*(\d+[.,]\d{2})\s*(?:EUR|€|kn|HRK)?/i,
      /(?:ukupno|total|iznos|plaćeno|za\s+platiti)\s+(?:EUR|€|kn|HRK)[:\s]*(\d+[.,]\d{2})/i,
      /(\d+[.,]\d{2})\s*(?:EUR|€)/i,
      /(\d+[.,]\d{2})\s*(?:kn|HRK)/i,
    ];
    
    const foundAmounts = [];
    for (const pattern of allAmountPatterns) {
      const matches = text.matchAll(new RegExp(pattern.source, pattern.flags));
      for (const match of matches) {
        if (match[1]) {
          let amount = match[1].replace(',', '.');
          const parsed = parseFloat(amount);
          if (!isNaN(parsed) && parsed > 0 && parsed < 1000000 && parsed >= 0.01) {
            foundAmounts.push(parsed);
          }
        }
      }
    }
    
    if (foundAmounts.length > 0) {
      const maxAmount = Math.max(...foundAmounts);
      if (maxAmount >= 1) {
        return maxAmount;
      }
    }
    
    const numbers = text.match(/\d+[.,]\d{2}/g);
    if (numbers && numbers.length > 0) {
      const amounts = numbers.map(n => parseFloat(n.replace(',', '.')))
        .filter(a => a > 0 && a < 1000000 && a >= 0.01);
      if (amounts.length > 0) {
        const maxAmount = Math.max(...amounts);
        return maxAmount > 0 ? maxAmount : null;
      }
    }
    return null;
  }

  extractStoreName(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    const isOCRError = (line) => {
      if (line.match(/^[A-Z]\s+[A-Z]\s+[a-z]+\s+[a-z]+\s+[a-z]$/i)) return true;
      if (line.match(/^[A-Z]\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]$/i)) return true;
      if (line.match(/^[A-Z]\s+[A-Z]\s+[a-z]+\s+[a-z]$/i)) return true;
      if (line.split(/\s+/).length > 4 && line.length < 20) return true;
      if (line.match(/^[A-Z]\s+[A-Z]\s+[A-Z]/) && line.length < 15) return true;
      return false;
    };
    
    const isValidStoreName = (line) => {
      if (!line || line.length < 3 || line.length > 60) return false;
      if (/^\d+/.test(line)) return false;
      if (/^\d{2}\.\d{2}\.\d{4}/.test(line)) return false;
      if (line.match(/^(OIB|PDV|BLAGAJNA|RAČUN|Datum|Iznos|UKUPNO|Vrijeme|SPLIT|PRODAVAONICA|DJELATNIK|Blagajna)/i)) return false;
      if (line.match(/^\d+[.,]\d{2}/)) return false;
      if (line.includes('BLAGAJNA') || line.includes('RAČUN BR') || line.includes('VRIJEME')) return false;
      if (isOCRError(line)) return false;
      return true;
    };
    
    const storePatterns = [
      /^([A-ZČĆŠĐŽ][A-ZČĆŠĐŽa-zčćšđž\s\.]+(?:d\.o\.o\.|j\.d\.o\.o\.|d\.d\.|d\.o\.o)[^]*?)(?:\s+za\s+trgovinu[^]*?)?/i,
      /^([A-ZČĆŠĐŽ][A-ZČĆŠĐŽa-zčćšđž\s\.]+(?:d\.o\.o\.|j\.d\.o\.o\.|d\.d\.|d\.o\.o))/i,
    ];

    for (const pattern of storePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let storeName = match[1].trim();
        const cleanupPatterns = [
          /\s+za\s+trgovinu.*$/i,
          /\s+za\s+promet.*$/i,
          /\s+i\s+promet.*$/i,
          /\s+trgovinu.*$/i,
        ];
        for (const cleanupPattern of cleanupPatterns) {
          storeName = storeName.replace(cleanupPattern, '').trim();
        }
        if (storeName.length > 60) {
          storeName = storeName.substring(0, 60).trim();
        }
        if (isValidStoreName(storeName)) {
          return storeName;
        }
      }
    }
    
    if (lines.length > 0) {
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i].trim();
        if (isValidStoreName(line)) {
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
        if (isValidStoreName(storeName)) {
          return storeName;
        }
      }
    }
    
    if (lines.length > 0) {
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i].trim();
        if (line.length >= 3 && 
            line.length <= 30 && 
            !isOCRError(line) &&
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
    const priceMatch = line.match(/(\d+[.,]\d{2})/g);
    if (!priceMatch || priceMatch.length === 0) {
      return null;
    }
    const firstNumberIndex = line.search(/\d/);
    if (firstNumberIndex === -1) {
      return null;
    }
    let name = line.substring(0, firstNumberIndex).trim();
    const prices = priceMatch.map(p => parseFloat(p.replace(',', '.')));
    const price = Math.max(...prices);
    if (price > 10000) {
      return null;
    }
    let quantity = 1;
    const quantityMatch = line.match(/(?:kol|količina)[:\s]*(\d+)/i) || 
                         line.match(/(\d+)\s*(?:x|×|\*)/i) ||
                         line.match(/^(\d+)\s+/);
    if (quantityMatch) {
      quantity = parseInt(quantityMatch[1]) || 1;
    }
    name = name.replace(/[|]/g, '').trim();
    if (name.length < 3) {
      return null;
    }
    if (name.match(/(?:OIB|PDV|BLAGAJNA|PRODAVAONICA|Račun|Datum)/i)) {
      return null;
    }
    return {
      name: name,
      quantity: quantity,
      price: price,
      total: price * quantity
    };
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
