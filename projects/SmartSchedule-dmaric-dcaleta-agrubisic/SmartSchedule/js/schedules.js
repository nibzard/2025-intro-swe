// schedules.js – AI rasporedi (OpenAI gpt-4o-mini)

// ===============================
// POZIV BACKEND AI RUTE
// ===============================
async function callOpenAIGenerate(prompt) {
  const response = await fetch("http://localhost:3001/ai-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    throw new Error("AI backend error: " + response.status);
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
    if (!dayData) return;

    for (const shift in dayData) {
      dayData[shift].forEach(workerKey => {
        result[workerKey][di] = shift;
      });
    }
  });

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
function isScheduleValid(aiJson) {
  const days = Object.keys(aiJson);

  for (const day of days) {
    const morning = aiJson[day].Morning || [];
    const afternoon = aiJson[day].Afternoon || [];

    if (morning.length < 1 || afternoon.length < 1) {
      return false;
    }
  }
  return true;
}

// ===============================
// GLAVNI AI WORKFLOW
// ===============================
async function generateScheduleWithAI(scheduleCode) {
  const data = getAllScheduleDataForAI(scheduleCode);

  let prompt = generateAIPrompt(data);
  let aiJson = null;
  let attempts = 0;

  while (attempts < 3) {
    const aiText = await callOpenAIGenerate(prompt);

    const jsonStart = aiText.indexOf("{");
    const jsonEnd = aiText.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("AI nije vratio JSON");
    }

    aiJson = JSON.parse(aiText.substring(jsonStart, jsonEnd + 1));

    if (isScheduleValid(aiJson)) {
      break;
    }

    attempts++;
    prompt +=
      "\nISPRAVAK:\nRaspored nije valjan jer neke smjene nisu pokrivene. " +
      "Moraš preraspodijeliti radnike tako da svaki dan ima barem jednog " +
      "radnika u Morning i Afternoon smjeni.";
  }

  if (!isScheduleValid(aiJson)) {
    throw new Error("AI nije uspio generirati valjan raspored");
  }

  const business = data.business;
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
    .map(([user, text]) => `- ${user}: ${text}`)
    .join("\n");

  if (!zahtjeviTekst) zahtjeviTekst = "Nema posebnih zahtjeva.";

  let radniciTekst = workers
    .map(w => `${w.username}#${w.id || ""}`)
    .join(", ");

  return `
Ti si AI sustav za izradu tjednog rasporeda rada.

PODACI TVRTKE:
- Radni dani: ${business.workDays == 7 ? "Ponedjeljak–Nedjelja" : "Ponedjeljak–Subota"}
- Radno vrijeme: ${business.workHours || "nije specificirano"}
- Maksimalni broj sati tjedno po radniku: ${business.weeklyLimit || 40}

RADNICI:
${radniciTekst}

ZAHTJEVI RADNIKA:
${zahtjeviTekst}


PRAVILA (OBAVEZNA, NE SMIJU SE KRŠITI):
- Svaki RADNI DAN mora imati NAJMANJE 2 RADNIKA ukupno
- Smjena "Morning" mora imati NAJMANJE 1 RADNIKA svaki dan
- Smjena "Afternoon" mora imati NAJMANJE 1 RADNIKA svaki dan
- Smjena "Mid" (ako postoji) mora imati barem 1 radnika ili se ne koristi
- Radnik smije imati "Off" samo ako su SVE smjene tog dana pokrivene
- Raspored koji krši ijedno od ovih pravila je NEVALIDAN i ne smije biti vraćen
- Radnik smije raditi samo dane koje je naveo
- Radnik ne smije prekoračiti maksimalni broj sati
- Raspodjela mora biti što ravnomjernija
 "Off" se ne navodi eksplicitno, radnik je Off ako nije u nijednoj smjeni tog dana
AKO NIJE MOGUĆE ispuniti sva pravila s dostupnim radnicima,
vrati i dalje JSON, ali s MINIMALNIM brojem "Off" dana
i prioritetom potpunog pokrivanja smjena.

ZADATAK:
Generiraj tjedni raspored rada.

FORMAT ODGOVORA:
Vrati ISKLJUČIVO JSON u ovom formatu:

{
  "Ponedjeljak": {
    "Morning": ["radnik1"],
    "Afternoon": ["radnik2"],
    "Mid": []
  },
  "Utorak": {
    "Morning": ["radnik2"],
    "Afternoon": ["radnik1"],
    "Mid": []
  }
}
NAPOMENA:
- Svaka smjena koja nema barem jednog radnika je NEVALIDNA
- Ako je smjena prazna, moraš preraspodijeliti radnike
- "Off" se ne navodi eksplicitno, radnik je Off ako nije u nijednoj smjeni tog dana


NE PIŠI:
- objašnjenja
- komentare
- tekst izvan JSON-a
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
