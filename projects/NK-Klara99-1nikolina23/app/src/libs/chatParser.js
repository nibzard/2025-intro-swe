// Parse user messages to extract trip preferences
export function parseUserInput(text) {
  const result = {
    origin: null,
    destination: null,
    startDate: null,
    endDate: null,
    budget: null,
    people: null,
    style: null,
    currency: "EUR",
  };

  // ===== ORIGIN PARSING =====
  // Pattern 1: Explicit keyword (from, od, polaz, krećem, početak)
  let originMatch = text.match(/(?:from|od|polaz|krećem|početak)[\s:]*([A-Z][a-z]+)/i);
  if (originMatch) {
    result.origin = originMatch[1].trim();
  } else {
    // Pattern 2: First city before delimiter (to, -, and, comma, ili, u)
    const delimiters = /(?:\s+to\s+|\s+-\s+|\s+and\s+|,\s*|\s+ili\s+|\s+u\s+|\s+→\s+)/i;
    const parts = text.split(delimiters);
    const firstPart = parts[0];
    const wordInFirst = firstPart.match(/\b[A-Z][a-z]+\b/);
    if (wordInFirst) result.origin = wordInFirst[0];
  }

  // ===== DESTINATION PARSING =====
  // Pattern 1: Explicit keyword (to, u, destinacija, idem)
  let destMatch = text.match(/(?:to|u|destinacija|idem)[\s:]*([A-Z][a-z]+)/i);
  if (destMatch) {
    result.destination = destMatch[1].trim();
  } else {
    // Pattern 2: After delimiter
    const delimiters = /(?:\s+to\s+|\s+-\s+|\s+and\s+|,\s*|\s+ili\s+|\s+u\s+|\s+→\s+)/i;
    const parts = text.split(delimiters);
    if (parts.length > 1) {
      const secondPart = parts[1];
      const wordInSecond = secondPart.match(/\b[A-Z][a-z]+\b/);
      if (wordInSecond) result.destination = wordInSecond[0];
    }
  }

  // ===== DATE RANGE PARSING =====
  // Pattern 1: Date range with month "15.5-23.5" or "15.05.-21.05."
  const dateMonthRangeMatch = text.match(/(\d{1,2})[.-](\d{1,2})\s*[-to]+\s*(\d{1,2})[.-](\d{1,2})/i);
  if (dateMonthRangeMatch) {
    const startDay = parseInt(dateMonthRangeMatch[1]);
    const endDay = parseInt(dateMonthRangeMatch[3]);
    if (endDay >= startDay) {
      result.startDate = `${dateMonthRangeMatch[1]}.${dateMonthRangeMatch[2]}`;
      result.endDate = endDay;
      result.durationDays = Math.max(1, endDay - startDay + 1);
    }
  } else {
    // Pattern 2: Simple range "15-21" (assumes same month)
    const simpleDateMatch = text.match(/\b(\d{1,2})[\s]*[-to]+[\s]*(\d{1,2})\b/i);
    if (simpleDateMatch) {
      const startDay = parseInt(simpleDateMatch[1]);
      const endDay = parseInt(simpleDateMatch[2]);
      if (endDay >= startDay) {
        result.durationDays = Math.max(1, endDay - startDay + 1);
        result.startDate = `${startDay}`;
      }
    } else {
      // Pattern 3: Single date "15.05" or "15-05"
      const singleDateMatch = text.match(/(\d{1,2})[.-](\d{1,2})/);
      if (singleDateMatch) {
        result.startDate = `${singleDateMatch[1]}.${singleDateMatch[2]}`;
      }
    }
  }

  // ===== BUDGET PARSING =====
  // Currency symbols: $, €, ¥, £, ¢, ₹, ₩, ₪, ₦, ₱, ฿, ₡, ₨, ₩, ₺
  const currencyMap = {
    usd: "USD",
    "$": "USD",
    eur: "EUR",
    "€": "EUR",
    jpy: "JPY",
    "¥": "JPY",
    gbp: "GBP",
    "£": "GBP",
    cny: "CNY",
    cnh: "CNH",
    aud: "AUD",
    cad: "CAD",
    hkd: "HKD",
    sgd: "SGD",
  };

  // Pattern 1: Budget keyword + number + currency
  const budgetKeywordMatch = text.match(/(?:budget|budž|budžet)[\s:]*([€$£¥]?)[\s]*(\d+(?:[.,]\d{2})?)/i);
  if (budgetKeywordMatch) {
    result.budget = parseFloat(budgetKeywordMatch[2].replace(",", "."));
    const currencySymbol = budgetKeywordMatch[1];
    if (currencySymbol) {
      result.currency = currencyMap[currencySymbol] || "EUR";
    }
  } else {
    // Pattern 2: Number + currency text (600 EUR, 600 Euro, 600 USD, etc.)
    const currencyTextMatch = text.match(/(\d+(?:[.,]\d{2})?)\s*(usd|eur|jpy|gbp|cny|cnh|aud|cad|hkd|sgd|euro|dollar|pound|yen)/i);
    if (currencyTextMatch) {
      result.budget = parseFloat(currencyTextMatch[1].replace(",", "."));
      const currencyText = currencyTextMatch[2].toLowerCase();
      result.currency = currencyMap[currencyText] || "EUR";
    } else {
      // Pattern 3: Number + symbol (€600, $600, £600, ¥600)
      const currencySymbolMatch = text.match(/([€$£¥])[\s]*(\d+(?:[.,]\d{2})?)/);
      if (currencySymbolMatch) {
        result.budget = parseFloat(currencySymbolMatch[2].replace(",", "."));
        result.currency = currencyMap[currencySymbolMatch[1]] || "EUR";
      }
    }
  }

  // ===== PEOPLE PARSING =====
  // Word to number mapping
  const wordNumbers = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  // Pattern 1: "2 people", "two people", "for 2 people", "for two people"
  const peopleMatch = text.match(/(?:for\s+|na\s+|za\s+)?([0-9]|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:people|person|osoba|osobe|nas|persons|ppl)/i);
  if (peopleMatch) {
    const numberStr = peopleMatch[1].toLowerCase();
    result.people = wordNumbers[numberStr] || parseInt(numberStr);
  } else {
    // Pattern 2: Standalone "two people", "2 people"
    const simplePeopleMatch = text.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:osoba|people)/i);
    if (simplePeopleMatch) {
      const numberStr = simplePeopleMatch[1].toLowerCase();
      result.people = wordNumbers[numberStr] || parseInt(numberStr);
    }
  }

  // ===== STYLE PARSING =====
  const lower = text.toLowerCase();
  if (lower.includes("budget") && !lower.match(/budget\s*\d/)) result.style = "budget";
  if (lower.includes("luxury") || lower.includes("skupo")) result.style = "luxury";
  if (lower.includes("standard") || lower.includes("srednje")) result.style = "standard";
  if (lower.includes("adventure") || lower.includes("avantura")) result.style = "adventure";
  if (lower.includes("premium")) result.style = "luxury";
  if (lower.includes("comfort")) result.style = "standard";

  return result;
}

// Check what data is still missing
export function getMissingData(preferences) {
  const missing = [];
  if (!preferences.origin) missing.push("origin");
  if (!preferences.destination) missing.push("destination");
  if (!preferences.startDate) missing.push("dates");
  if (!preferences.budget) missing.push("budget");
  return missing;
}

// Generate itinerary based on preferences
export function generateItinerary(preferences) {
  const { startDate, endDate, budget, people = 1, durationDays, currency = "EUR" } = preferences;
  const { destination } = preferences;

  // Calculate days from startDate and endDate (YYYY-MM-DD format)
  let numDays = durationDays;
  
  if (!numDays && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    numDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
  }
  
  // Fallback: estimate from budget
  if (!numDays) {
    numDays = Math.max(3, Math.floor((budget || 500) / (people * 50)));
  }
  
  // Extract day number for display
  let startDay = 1;
  if (startDate) {
    const dateObj = new Date(startDate);
    if (!isNaN(dateObj)) {
      startDay = dateObj.getDate();
    }
  }

  const { style = "standard" } = preferences;
  const days = [];
  for (let i = 0; i < numDays; i++) {
    const day = startDay + i;
    days.push({
      day: i + 1,
      date: `Day ${day}`,
      activities: generateDayActivities(i),
      meals: generateMeals(i, style),
      estimatedCost: Math.round((budget || 500) / numDays / people),
    });
  }

  return {
    destination,
    days,
    totalBudget: budget,
    people,
    style,
    currency,
    generatedAt: new Date().toISOString(),
  };
}

function generateDayActivities(dayNum) {
  const activities = {
    0: ["City center exploration", "Main attractions", "Local landmarks"],
    1: ["Museums and galleries", "Local culture", "Historic sites"],
    2: ["Day trip or adventure", "Nature/outdoor activities", "Local experiences"],
  };

  const defaultActivities = ["Shopping", "Dining", "Relaxation"];
  return activities[dayNum] || defaultActivities;
}

function generateMeals(dayNum, style) {
  const mealsByStyle = {
    budget: ["Street food", "Local cafe", "Market"],
    standard: ["Local restaurant", "Traditional cuisine", "Casual dining"],
    luxury: ["Fine dining", "Michelin restaurant", "Premium cuisine"],
    adventure: ["Food tour", "Market experience", "Local specialties"],
  };

  return mealsByStyle[style] || mealsByStyle.standard;
}
