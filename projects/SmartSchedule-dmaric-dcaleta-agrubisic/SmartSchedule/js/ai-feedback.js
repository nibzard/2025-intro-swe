// js/ai-feedback.js

// Funkcija za izračun sati po radniku
function izracunajSate(schedule, workers, days) {
  const SATI = {
    "07:00 - 14:00": 7,
    "14:00 - 21:00": 7,
    "10:00 - 15:00": 5,
    "Slobodan": 0,
    "": 0,
    "-": 0
  };
  const rezultat = [];
  workers.forEach(w => {
    const key = w.username + '#' + w.id;
    let suma = 0;
    days.forEach((d, i) => {
      const val = schedule[key]?.[i] || "";
      suma += SATI[val] ?? 0;
    });
    rezultat.push({ radnik: key, sati: suma });
  });
  return rezultat;
}

// Funkcija za slanje podataka o rasporedu na backend i dohvat AI analize
export async function fetchAIAnalysis(schedule, workers, days, tjedniLimit) {
  // Izračunaj sate u JS
  const satiPoRadniku = izracunajSate(schedule, workers, days);
  let prompt = `Ovo su ukupni sati rada po radniku u tjednu:\n`;
  satiPoRadniku.forEach(r => {
    prompt += `- ${r.radnik}: ${r.sati}h\n`;
  });
  prompt += `\nTjedni limit je ${tjedniLimit}h.\n Napisi za svakoga koliko su radili i jesu li ispod ili povise limita i za koliko. Odgovori kratko na hrvatskom. i svaku osobu stavi u svoj red\n`;
  console.log('AI PROMPT:', prompt);
  const res = await fetch('http://localhost:3001/ai-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error('AI analiza nije uspjela');
  const data = await res.json();
  return data.result;
}
