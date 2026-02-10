// Prikaz AI poruka u sidebaru
window.appendAIMessage = function(msg, type = 'ai') {
  let chat = document.getElementById('aiChatMessages');
  if (!chat) return;
  let div = document.createElement('div');
  div.textContent = msg;
  div.style.background = type === 'ai' ? '#3a7afe22' : '#222a';
  div.style.color = type === 'ai' ? '#3a7afe' : '#f1f1f1';
  div.style.padding = '8px 12px';
  div.style.borderRadius = '8px';
  // AI poruke lijevo, korisnik desno
  div.style.alignSelf = type === 'ai' ? 'flex-start' : 'flex-end';
  div.style.maxWidth = '90%';
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
// schedules.js – AI rasporedi (OpenAI gpt-4o-mini)

// ===============================
// POZIV BACKEND AI RUTE
// ===============================
async function callOpenAIGenerate(prompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response;
  try {
    response = await fetch("http://localhost:3001/ai-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal: controller.signal
    });
  } catch (err) {
    window.appendAIMessage("FETCH ERROR: " + err.message, 'ai');
    alert("FETCH ERROR: " + err.message + "\nProvjeri je li backend pokrenut na http://localhost:3001 i je li CORS omogućen.");
    throw err;
  } finally {
    clearTimeout(timeout);
  }
  if (!response || !response.ok) {
    let status = response ? response.status : 'NO RESPONSE';
    let text = response ? await response.text() : '';
    window.appendAIMessage("AI backend error: " + status + "\n" + text, 'ai');
    alert("AI backend error: " + status + "\n" + text);
    throw new Error("AI backend error: " + status);
  }
  const data = await response.json();
  return data.result;
}
//nesto
function convertAIDayShiftToWorkerSchedule(aiJson, workers, days) {
  const result = {};
  // inicijaliziraj sve radnike
  workers.forEach(w => {
    const key = w.username + "#" + w.id;
    result[key] = Array(days.length).fill("Off");
  });
  days.forEach((day, di) => {
    const dayData = aiJson[day];
    if (!dayData) {
      console.warn("AI JSON nema dan:", day);
      return;
    }
    ["Morning","Afternoon"].forEach(shift => {
      (dayData[shift] || []).forEach(workerKey => {
        if (result[workerKey]) {
          result[workerKey][di] = shift;
        } else {
          console.warn("AI JSON ima radnika koji nije u listi workers:", workerKey, "za dan", day, "smjena", shift);
        }
      });
    });
  });
  console.log("[DEBUG] Konvertirani raspored po radnicima:", result);
  return result;
}

// ===============================
// SPREMANJE AI RASPOREDA
// ===============================
function fillScheduleFromAIJson(scheduleCode, aiJson) {
  const allSchedules = JSON.parse(localStorage.getItem("allSchedules") || "{}");
  const scheduleInfo = allSchedules[scheduleCode] || {};
  scheduleInfo.schedule = aiJson;
  allSchedules[scheduleCode] = scheduleInfo;
  localStorage.setItem("allSchedules", JSON.stringify(allSchedules));
}

//pomoćna
function isScheduleValid(aiJson, business) {

  const days = business.workDays === 7
    ? ["Ponedjeljak","Utorak","Srijeda","Četvrtak","Petak","Subota","Nedjelja"]
    : ["Ponedjeljak","Utorak","Srijeda","Četvrtak","Petak","Subota"];

  const allWorkers = new Set();

  // 1️⃣ Skupi sve radnike iz JSON-a
  Object.values(aiJson).forEach(day => {
    ["Morning","Afternoon"].forEach(shift => {
      (day[shift] || []).forEach(w => allWorkers.add(w));
    });
  });

  // ❗ Ako AI nije dodijelio nekog radnika NIGDJE, raspored nije valjan
  if (allWorkers.size === 0) return false;

  // 2️⃣ Svaki dan mora imati Morning i Afternoon
  for (const day of days) {
    const d = aiJson[day];
    if (!d) return false;
    if (!d.Morning || d.Morning.length < 1) return false;
    if (!d.Afternoon || d.Afternoon.length < 1) return false;
  }

  // 3️⃣ Inicijaliziraj SVE radnike
  const workerDays = {};
  allWorkers.forEach(w => workerDays[w] = new Set());

  Object.entries(aiJson).forEach(([day, dayData]) => {
    ["Morning","Afternoon"].forEach(shift => {
      (dayData[shift] || []).forEach(w => {
        workerDays[w].add(day);
      });
    });
  });

  // 4️⃣ Najviše 1 slobodan dan po radniku
  for (const w in workerDays) {
    const worked = workerDays[w].size;
    const off = days.length - worked;
    if (off > 1) return false;
  }

  return true;
}

// ===============================
// GLAVNI AI WORKFLOW
// ===============================
async function generateScheduleWithAI(scheduleCode) {
  const data = getAllScheduleDataForAI(scheduleCode);

  let prompt = generateAIPrompt(data) + "\nVRATI ISKLJUČIVO ISPRAVAN JSON prema gornjim pravilima. Ako ne možeš, objasni zašto, ali uvijek pokušaj generirati ispravan JSON!";
  let aiJson = null;
  let attempts = 0;

  let aiExplanation = null;
  const validKeys = new Set(data.workers.map(w => w.username + '#' + w.id));
  const business = data.business;
  while (attempts < 5) {
    const aiText = await callOpenAIGenerate(prompt);
    const jsonStart = aiText.indexOf("{");
    let jsonEnd = aiText.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      window.appendAIMessage("AI: " + aiText, 'ai');
      localStorage.setItem('aiExplanation', aiText);
      alert("AI nije vratio JSON! Sirovi odgovor AI-a:\n" + aiText);
      throw new Error("AI nije vratio JSON");
    }
    // Ukloni sve nakon zadnje vitičaste zagrade
    let jsonStr = aiText.substring(jsonStart, jsonEnd + 1);
    let explanation = '';
    if (jsonEnd + 1 < aiText.length) {
      explanation = aiText.substring(jsonEnd + 1).trim();
    } else if (jsonStart > 0) {
      explanation = aiText.substring(0, jsonStart).trim();
    }
    if (explanation) {
      aiExplanation = explanation;
      localStorage.setItem('aiExplanation', explanation);
    }
    let aiJsonParsed = null;
    try {
      aiJsonParsed = JSON.parse(jsonStr);
      const expectedDays = business.workDays == 7
  ? ["Ponedjeljak","Utorak","Srijeda","Četvrtak","Petak","Subota","Nedjelja"]
  : ["Ponedjeljak","Utorak","Srijeda","Četvrtak","Petak","Subota"];

expectedDays.forEach(day => {
  if (!aiJsonParsed[day]) {
    aiJsonParsed[day] = { Morning: [], Afternoon: [] };
  }
});
    } catch (e) {
      window.appendAIMessage("AI JSON PARSE ERROR: " + e.message, 'ai');
      alert("AI nije vratio ispravan JSON! Sirovi odgovor AI-a:\n" + aiText);
      throw new Error("AI nije vratio ispravan JSON");
    }
    aiJson = aiJsonParsed;
    // 1️⃣ Filtriraj AI radnike koji ne postoje PRIJE validacije
    Object.values(aiJson).forEach(day => {
      ["Morning","Afternoon"].forEach(shift => {
        day[shift] = (day[shift] || []).filter(w => validKeys.has(w));
      });
    });
    // Uklonjeno forsiranje šefice
   if (isScheduleValid(aiJson, business)) {

  const daysArr = business.workDays == 7
    ? ["Ponedjeljak","Utorak","Srijeda","Četvrtak","Petak","Subota","Nedjelja"]
    : ["Ponedjeljak","Utorak","Srijeda","Četvrtak","Petak","Subota"];

  const converted = convertAIDayShiftToWorkerSchedule(
    aiJson,
    data.workers,
    daysArr
  );

  fillScheduleFromAIJson(scheduleCode, converted);
  return converted;
}
    attempts++;
    prompt +=
      "\nISPRAVAK:\nRaspored nije valjan jer neke smjene nisu pokrivene. " +
      "Moraš preraspodijeliti radnike tako da svaki dan ima barem jednog " +
      "radnika u Morning i Afternoon smjeni.";
  }
  // Ako ni nakon 5 pokušaja nije valjano
  throw new Error("AI nije uspio generirati valjan raspored");
  if (!isScheduleValid(aiJson, business)) {
    window.appendAIMessage("AI: " + JSON.stringify(aiJson, null, 2), 'ai');
    alert("AI nije uspio generirati valjan raspored! Sirovi JSON AI-a:\n" + JSON.stringify(aiJson, null, 2));
    throw new Error("AI nije uspio generirati valjan raspored");
  }
  if (aiExplanation) {
    window.appendAIMessage("AI povratna informacija: " + aiExplanation, 'ai');
    localStorage.setItem('aiExplanation', aiExplanation);
    console.log("AI Explanation:", aiExplanation);
  }
  const days =
    business.workDays == 7
      ? ["Ponedjeljak","Utorak","Srijeda","Četvrtak","Petak","Subota","Nedjelja"]
      : ["Ponedjeljak","Utorak","Srijeda","Četvrtak","Petak","Subota"];
  const converted = convertAIDayShiftToWorkerSchedule(
    aiJson,
    data.workers,
    days
  );
  fillScheduleFromAIJson(scheduleCode, converted);
  return converted;

}



// ===============================
// PROMPT GENERATOR
// ===============================
function generateAIPrompt({ business, workers, requests }) {

  let zahtjeviTekst = Object.entries(requests)
    .map(([user, value]) => {
      if (typeof value === "string") {
        return `- ${user}: ${value}`;
      } else if (typeof value === "object" && value !== null) {
        // Pretvori objekt po danima u tekst
        const dani = Object.entries(value)
          .map(([dan, smjena]) => `${dan}: ${smjena || 'Slobodan'}`)
          .join(", ");
        return `- ${user}: ${dani}`;
      } else {
        return `- ${user}: (nepoznat format)`;
      }
    })
    .join("\n");

  if (!zahtjeviTekst) zahtjeviTekst = "Nema posebnih zahtjeva.";

  let radniciTekst = workers
    .map(w => `${w.username}#${w.id}`)
    .join(", ");

  return `
Ti generiraš tjedni raspored rada.

RADNI DANI:
${business.workDays == 7 ? "Ponedjeljak do Nedjelja" : "Ponedjeljak do Subota"}

SMJENE:
- Morning = 07:00 – 14:00
- Afternoon = 14:00 – 21:00

RADNICI:
${radniciTekst}

ZAHTJEVI (POŠTUJ AKO JE MOGUĆE):
${zahtjeviTekst}

PRAVILA (OBAVEZNA):
1. Svaki radni dan mora imati barem 1 radnika u Morning i 1 u Afternoon smjeni
2. Radnik NE SMIJE raditi Morning i Afternoon isti dan
3. Radnik smije imati NAJVIŠE 1 slobodan dan u tjednu
4. Koristi ISKLJUČIVO navedene radnike
5. Vrati ISKLJUČIVO JSON, bez objašnjenja

FORMAT:
{
  "Ponedjeljak": {
    "Morning": [],
    "Afternoon": []
  }
}
`;
}



// ===============================
// DOHVAT PODATAKA ZA AI
// ===============================
function getAllScheduleDataForAI(scheduleCode) {
  const allSchedules = JSON.parse(localStorage.getItem("allSchedules") || "{}");
  const scheduleInfo = allSchedules[scheduleCode] || {};
  const business = JSON.parse(localStorage.getItem("business") || "{}");
  const workers = Array.isArray(scheduleInfo.workers) ? scheduleInfo.workers : [];
  const allRequests = JSON.parse(localStorage.getItem("workerRequests") || "{}");
  const requests = allRequests[scheduleCode] || {};

  return {
    business,
    workers,
    requests
  };
}

// ===============================
// PRIKAZ ZADNJE AI POVRATNE INFORMACIJE
// ===============================
window.showLastAIExplanation = function() {
  const explanation = localStorage.getItem('aiExplanation');
  if (explanation) {
    window.appendAIMessage("AI povratna informacija: " + explanation, 'ai');
  }
};
