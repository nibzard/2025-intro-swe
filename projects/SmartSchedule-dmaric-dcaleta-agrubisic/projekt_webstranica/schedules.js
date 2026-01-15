// UNIVERSAL VALIDATOR FOR AI JSON SCHEDULE PROPOSAL
function validateAIProposal(schedule, aiResult) {
    const warnings = [];
    if (!aiResult || typeof aiResult !== 'object') return { ok: false, error: 'AI rezultat nije objekt' };
    if (!aiResult.shifts || typeof aiResult.shifts !== 'object') return { ok: false, error: 'Nedostaje shifts objekt' };

    const workers = schedule.workers || [];
    // Struktura: svi radnici moraju imati shifts array duljine 7
    for (const w of workers) {
        const arr = aiResult.shifts[w.id];
        if (!arr || !Array.isArray(arr) || arr.length !== 7) {
            return { ok: false, error: `Radnik ${w.name} nema ispravan shifts array (7 dana)` };
        }
        // Popunjenost: nema praznih polja
        for (let i = 0; i < 7; i++) {
            const val = arr[i];
            if (val === '' || val == null || typeof val !== 'string') {
                return { ok: false, error: `Prazno polje za radnika ${w.name} na dan ${i+1}` };
            }
        }
        // Pravila: nitko ne smije imati više od 40h
        let totalHrs = 0;
        for (let i = 0; i < 7; i++) {
            const val = arr[i];
            if (val.toLowerCase().includes('slob')) continue;
            if(val.includes('Jutarnja')) totalHrs+=7;
            if(val.includes('Popodnevna')) totalHrs+=7;
            if(val.includes('Međusmjena')) totalHrs+=4;
        }
        if (totalHrs > 40) {
            warnings.push(`Radnik ${w.name} ima ${totalHrs}h (limit 40h)`);
        }
        // Pravila: kod pon-ned mora imati točno jedan slobodan dan, kod pon-sub ne mora
        const workdaysSetting = (schedule.companySettings && schedule.companySettings.workdays) ? schedule.companySettings.workdays : 'pon-sub';
        if (workdaysSetting === 'pon-ned') {
            const freeDays = arr.filter(v => v && v.toLowerCase().includes('slob')).length;
            if (freeDays !== 1) warnings.push(`Radnik ${w.name} mora imati točno jedan slobodan dan (ima ${freeDays})`);
        }
    }
    return warnings.length ? { ok: true, warnings } : { ok: true, warnings: [] };
}
// ...existing code...
// schedules.js — manage business schedules in localStorage
// All functions are synchronous except where noted. No external APIs.

function _getSchedules(){
    try { return JSON.parse(localStorage.getItem('ss_schedules') || '[]'); }
    catch(e){ return []; }
}

function _saveSchedules(arr){
    localStorage.setItem('ss_schedules', JSON.stringify(arr));
}

function _generateCode(len=6){
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude confusing chars
    let code = '';
    const existing = new Set(_getSchedules().map(s=>s.code));
    do {
        code = Array.from({length:len}, ()=>chars[Math.floor(Math.random()*chars.length)]).join('');
    } while (existing.has(code));
    return code;
}

function createSchedule({ownerId, workers, companySettings: scheduleSettings}){
    if (!ownerId) throw new Error('ownerId required');
    workers = workers || [];

    // validation: no empty names, no duplicates
    const names = workers.map(w => (w.name||'').trim()).filter(n=>n!=="");
    if (names.length !== workers.length) throw new Error('Svi radnici moraju imati ime');
    const dup = names.find((n,i)=> names.indexOf(n) !== i);
    if (dup) throw new Error('Dupli radnik: ' + dup);

    // prefer schedule-provided settings, otherwise use owner's defaults
    const companySettings = scheduleSettings || ((window.ssAuth && ssAuth.getCompanySettings) ? ssAuth.getCompanySettings(ownerId) : null);
    if (!companySettings) throw new Error('Definirajte postavke rasporeda');

    const schedules = _getSchedules();
    const id = 's'+Date.now()+Math.floor(Math.random()*9999);
    const code = _generateCode();
    const createdAt = Date.now();

    const shifts = {};
    workers.forEach(w => {
        shifts[w.id] = Array(7).fill(''); // 7 days
    });

    // status: draft | published | locked
    const status = 'draft';

    // attach company settings snapshot
    const companySettingsSnapshot = JSON.parse(JSON.stringify(companySettings));

    const schedule = { id, code, ownerId, workers, shifts, createdAt, status, companySettings: companySettingsSnapshot };
    schedules.push(schedule);
    _saveSchedules(schedules);
    return schedule;
}

function getScheduleByCode(code){
    const schedules = _getSchedules();
    return schedules.find(s => s.code === (code||'').toUpperCase()) || null;
}

function getScheduleById(id){
    return _getSchedules().find(s => s.id === id) || null;
}

function getSchedulesByOwner(ownerId){
    return _getSchedules().filter(s => s.ownerId === ownerId);
}

// helper: parse shift time 'HH:MM-HH:MM' -> hours as number
function parseShiftDuration(shiftStr){
    if (!shiftStr || shiftStr.toLowerCase().includes('slob')) return 0;
    const m = shiftStr.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
    if (!m) return 0;
    const [_, s1, s2] = m;
    const p = (t)=>{
        const parts = t.split(':').map(x=>parseInt(x,10));
        return parts[0] + (parts[1]/60);
    };
    let start = p(s1), end = p(s2);
    if (end <= start) end += 24; // overnight
    return Math.round((end - start) * 100) / 100;
}

function computeWorkerWeeklyHours(schedule, workerId){
    const settings = schedule.companySettings || {};
    const shifts = schedule.shifts[workerId] || [];
    let total = 0;
    shifts.forEach(val=>{ total += parseShiftDuration(val || ''); });
    return total; // hours
}

function validateScheduleAgainstCompanySettings(schedule){
    // Ova funkcija više nije potrebna u novoj logici, vraća prazno
    return [];
}

function updateSchedule(schedule){
    // permission & locked checks
    const current = (window.ssAuth && ssAuth.getCurrentUser && ssAuth.getCurrentUser()) || null;
    if (!current) throw new Error('Niste prijavljeni');
    if (current.id !== schedule.ownerId) throw new Error('Nemate ovlasti za uređivanje rasporeda');
    if (schedule.status === 'locked') throw new Error('Raspored je zaključan i ne može se mijenjati');

    const schedules = _getSchedules();
    const idx = schedules.findIndex(s=>s.id === schedule.id);
    if (idx === -1) throw new Error('Schedule not found');

    // NE VALIDIRAJ strogo kod promjene postavki rasporeda

    schedules[idx] = schedule;
    _saveSchedules(schedules);
}

// Helper to collect workers from DOM in business-create.html
function collectWorkersFromDOM(containerId='workersPanel'){
    const panel = document.getElementById(containerId);
    const boxes = panel ? panel.querySelectorAll('.worker-box') : [];
    const workers = [];
    boxes.forEach((b,i)=>{
        const nameEl = b.querySelector('input[type="text"]');
        const noteEl = b.querySelector('textarea');
        const name = nameEl ? nameEl.value.trim() : '';
        const notes = noteEl ? noteEl.value.trim() : '';
        if (name) workers.push({ id: 'w'+Date.now() + i + Math.floor(Math.random()*99), name, notes });
    });
    return workers;
}

// Render schedule table in business-final.html
function renderScheduleTable(schedule, containerId='scheduleContainer', opts={onChange:null, allowEdit:false}){
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'schedule-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    const days = ['Ponedjeljak','Utorak','Srijeda','Četvrtak','Petak','Subota','Nedjelja'];

    // header
    const thead = document.createElement('thead');
    const hrow = document.createElement('tr');
    hrow.appendChild(document.createElement('th')); // corner
    days.forEach(d=>{
        const th = document.createElement('th');
        th.innerText = d;
        th.style.border = '1px solid var(--border)';
        th.style.padding = '6px';
        hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    // body
    const tbody = document.createElement('tbody');
    schedule.workers.forEach(w=>{
        const tr = document.createElement('tr');
        const nameTd = document.createElement('td');
        nameTd.innerHTML = `<strong>${w.name}</strong><div style="color:var(--text-soft); font-size:12px;">${w.notes||''}</div>`;
        nameTd.style.border = '1px solid var(--border)';
        nameTd.style.padding = '6px';
        nameTd.style.width = '220px';
        tr.appendChild(nameTd);

        for (let di=0; di<7; di++){
            const td = document.createElement('td');
            td.style.border = '1px solid var(--border)';
            td.style.padding = '6px';
            td.style.textAlign = 'center';
            td.dataset.workerId = w.id;
            td.dataset.dayIndex = di;
            td.innerText = (schedule.shifts[w.id] && schedule.shifts[w.id][di]) || '';

            if (opts.allowEdit) {
                td.style.cursor = 'pointer';
                td.onclick = () => {
                    // prompt for a simple shift string
                    const current = (schedule.shifts[w.id] && schedule.shifts[w.id][di]) || '';
                    const val = prompt('Unesi smjenu / slobodno', current);
                    if (val === null) return; // cancel
                    schedule.shifts[w.id] = schedule.shifts[w.id] || Array(7).fill('');
                    schedule.shifts[w.id][di] = val.trim();
                    td.innerText = schedule.shifts[w.id][di];
                    // mark unsaved
                    if (opts.onChange) opts.onChange(true);
                };
            } else {
                // read-only styling
                td.style.cursor = 'default';
            }

            // highlight current user's row if name matches
            const cur = (window.ssAuth && ssAuth.getCurrentUser && ssAuth.getCurrentUser()) || null;
            if (cur && cur.name && cur.name === w.name) {
                tr.style.background = 'linear-gradient(90deg, rgba(79,124,255,0.02), rgba(0,0,0,0.00))';
            }

            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    // visual read-only indication
    if (!opts.allowEdit) {
        container.classList.add('read-only-schedule');
    } else {
        container.classList.remove('read-only-schedule');
    }
}

// AI simulation - analyze notes and detect simple conflicts
function aiAnalyzeSchedule(schedule){
    // security: only owner may run AI analysis
    const cur = (window.ssAuth && ssAuth.getCurrentUser && ssAuth.getCurrentUser()) || null;
    if (!cur || cur.id !== schedule.ownerId) return { error: 'Nemate ovlasti' };

    const feedback = [];
    const conflicts = [];

    // collect keywords for days and unavailable
    const dayKeys = ['ponedjeljak','utorak','srijeda','četvrtak','petak','subota','nedjelja'];

    schedule.workers.forEach(w => {
        const note = (w.notes||'').toLowerCase();
        if (!note) return;

        // detect "slobodno" or "free" => assume unavailable
        if (note.includes('slob') || note.includes('slobod')) {
            feedback.push(`${w.name} traži slobodno — provjeri kompatibilnost smjena.`);
        }

        // detect day mentions
        dayKeys.forEach((dk,i)=>{
            if (note.includes(dk)) {
                conflicts.push({ worker: w.name, day: dk });
            }
        });
    });

    if (conflicts.length > 0) {
        feedback.push('Otkriveni su specifični zahtjevi po danima: ' + conflicts.map(c=>`${c.worker} (${c.day})`).join(', '));
    }

    if (feedback.length === 0) feedback.push('Nema očitih konflikata u bilješkama.');

    return { feedback, conflicts };
}

// AI proposal: strict scheduler — fill every template for each day, balance hours and enforce constraints
// FINALNI AI FLOW: poziv, validacija, preview, fallback
async function proposeScheduleWithAI(schedule) {
    // Priprema payloada
    const payload = {
        companySettings: schedule.companySettings,
        workers: schedule.workers.map(w => ({
            id: w.id,
            name: w.name,
            currentHours: typeof getWeeklyHours === 'function' ? getWeeklyHours(schedule, w.id) : 0
        })),
        shiftTemplates: schedule.companySettings.shiftTemplates,
        existing: schedule.shifts
    };
    // Priprema prompta
    function buildSchedulePrompt(payload) {
        return `PROMPT ZA GENERIRANJE RASPOREDA OD NULE\n\nTi si sustav za strogo generiranje radnog rasporeda.\nNemaš slobodu odlučivanja izvan zadanih pravila.\nAko prekršiš ijedno pravilo, odgovor je pogrešan.\n\nOSNOVNE POSTAVKE OBJEKTA\n\nRadni dani su:\nod ponedjeljka do subote ILI\nod ponedjeljka do nedjelje\nTo će biti jasno naznačeno u ulazu.\n\nRadno vrijeme objekta je fiksno, npr:\n07:00 do 21:00\n\nObjekt nikada ne smije biti bez radnika.\nU svakom trenutku rada mora biti barem jedan radnik prisutan.\n\nPRAVILA O RADNICIMA\n\nTjedni limit rada je TOČNO ${payload.companySettings.weeklyLimit || 40} sati.\nnitko ne smije imati 41, 42 ili više sati\nprekoračenje NIJE dopušteno\n\nAko je objekt otvoren 7 dana u tjednu:\nsvaki radnik MORA imati točno jedan slobodan dan\nslobodan dan se ne smije proizvoljno dodjeljivati ako nije potreban\n\nAko je netko slobodan:\npreostali radnici rade pune smjene\nnema umjetnog skraćivanja ako ne postoji potreba\n\nSMJENE I NJIHOVA SVRHA\n\nPostoje samo sljedeće smjene i NIJEDNA DRUGA:\nJutarnja\nPopodnevna\nMeđusmjena\n\nPravila korištenja međusmjene\n\nMeđusmjena se koristi ISKLJUČIVO za:\nkorekciju sati\nskidanje viška od 1 do 2 sata\n\nMeđusmjena NIJE slobodan dan\n\nMeđusmjena se koristi kada bi radnik inače imao više od 40 sati\n\nPrimjer:\nAko bi radnik imao 42 sata:\njedan dan se koristi međusmjena\ntime se radnik vraća na točno 40 sati\n\nZABRANJENA PONAŠANJA\n\nSTROGO ZABRANJENO:\ndavati slobodan dan ako nije eksplicitno potreban\ndavati slobodan dan umjesto međusmjene\nostaviti objekt bez radnika\ndodijeliti više od 40 sati\nignorirati postojanje međusmjene\nizmišljati nove smjene\nostavljati prazna polja\n\nAko ne možeš ispuniti pravila, moraš to jasno napisati kao grešku.\n\nCILJ ALGORITMA\n\nPrvo popuni sve dane i sve sate rada objekta\nZatim osiguraj da svi radnici imaju ≤ 40 sati\nAko je potrebno, koristi međusmjenu\nSlobodan dan koristi samo ako objekt radi 7 dana\n\nKonačni raspored mora biti:\npotpun\nbez praznina\nbez prekoračenja sati\n\nFORMAT ODGOVORA\n\nVrati ISKLJUČIVO JSON u ovom obliku:\n{\n  "shifts": {\n    "workerId1": ["Jutarnja", "Popodnevna", "Međusmjena", "Slobodno", "..."],\n    "workerId2": ["Popodnevna", "Jutarnja", "Jutarnja", "..."]\n  },\n  "warnings": []\n}\n\nAko je raspored nemoguć, vrati:\n{\n  "error": "Razlog zašto raspored nije moguće složiti po pravilima"\n}\n\nBez objašnjenja. Bez dodatnog teksta. Samo JSON.\n\nPODACI:\n${JSON.stringify(payload, null, 2)}`;
    }
    const prompt = buildSchedulePrompt(payload);
    // Poziv backendu
    let aiResult;
    try {
        const res = await fetch('/api/schedule-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        if (!res.ok) {
            const err = await res.json().catch(()=>({}));
            throw new Error(err.error || 'AI server error');
        }
        const data = await res.json();
        aiResult = JSON.parse(data.result);
    } catch (e) {
        aiResult = null;
    }
    // Validacija AI odgovora
    let validation = aiResult ? validateAIProposal(schedule, aiResult) : { ok: false, error: 'AI nije vratio valjan raspored' };
    // Fallback na lokalni algoritam ako AI ne valja
    if (!validation.ok) {
        aiResult = aiProposeSchedule(schedule).proposal;
        validation = validateAIProposal(schedule, aiResult);
        if (!validation.ok) return { error: 'Ni AI ni lokalni algoritam ne mogu generirati valjan raspored: ' + validation.error };
    }
    // Preview: ne primjenjuj odmah
    schedule.proposal = aiResult;
    return { proposal: aiResult, warnings: validation.warnings };
}

// Sigurno primijeni AI prijedlog
function applyAIProposal(schedule) {
    if (!schedule.proposal || !schedule.proposal.shifts) {
        alert('Nema AI prijedloga za primjenu');
        return;
    }
    const validation = validateAIProposal(schedule, schedule.proposal);
    // Kritične greške: prelazak limita, nedostatak slobodnog dana, nepoznata smjena
    if (!validation.ok) {
        alert('AI prijedlog nije valjan: ' + validation.error);
        return;
    }
    // Ako postoje warnings, blokiraj primjenu i jasno prikaži korisniku
    if (validation.warnings && validation.warnings.length) {
        alert('AI prijedlog krši pravila:\n' + validation.warnings.join('\n'));
        return;
    }
    schedule.shifts = schedule.proposal.shifts;
    delete schedule.proposal;
}
// ...existing code...
function aiProposeSchedule(schedule){
    const cur = (window.ssAuth && ssAuth.getCurrentUser && ssAuth.getCurrentUser()) || null;
    if (!cur || cur.id !== schedule.ownerId) return { error: 'Nemate ovlasti' };

    // Novi algoritam: ravnomjerno dijeli sate (maks 40h) koristeći samo dvije smjene (Jutarnja, Popodnevna) i međusmjenu za korekciju
    const workers = schedule.workers;
    const numWorkers = workers.length;
    // Detekcija radnih dana
    const workdaysSetting = (schedule.companySettings && schedule.companySettings.workdays) ? schedule.companySettings.workdays : 'pon-sub';
    const days = workdaysSetting === 'pon-ned' ? 7 : 6;
    const dayNames = ['Ponedjeljak','Utorak','Srijeda','Četvrtak','Petak','Subota','Nedjelja'];
    const workTime = (schedule.companySettings && schedule.companySettings.workTime) ? schedule.companySettings.workTime : '07:00-21:00';
    // Smjene: Jutarnja 07:00-14:00 (7h), Popodnevna 14:00-21:00 (7h), Međusmjena 12:00-16:00 (4h)
    const shifts = [
        { name: 'Jutarnja', time: '07:00-14:00', hours: 7 },
        { name: 'Popodnevna', time: '14:00-21:00', hours: 7 },
        { name: 'Međusmjena', time: '12:00-16:00', hours: 4 }
    ];
    // Ukupno sati tjedno za pokriti: broj radnih dana * sati po danu
    const [start, end] = workTime.split('-');
    function parseTime(t){ const [h,m]=t.split(':').map(Number); return h+(m/60); }
    let totalHoursPerDay = parseTime(end)-parseTime(start); if (totalHoursPerDay<0) totalHoursPerDay+=24;
    let totalWeekHours = totalHoursPerDay * days;
    // Cilj: svi radnici što ravnomjernije, nitko preko 40h
    let target = Math.min(40, Math.floor(totalWeekHours/numWorkers));
    // Pripremi praznu tablicu
    const proposal = {};
    workers.forEach(w=>{ proposal[w.id]=Array(7).fill(''); });
    // Raspodijeli smjene po danima
    for(let d=0;d<days;d++){
        // Za svaki dan, podijeli smjene radnicima kružno
        let order = [...workers].map((w,i)=>({w,i}));
        // rotiraj redoslijed svaki dan radi ravnoteže
        order = order.slice(d%numWorkers).concat(order.slice(0,d%numWorkers));
        // Jutarnja i popodnevna svaki dan
        if(numWorkers>=2){
            proposal[order[0].w.id][d]=shifts[0].name+' '+shifts[0].time;
            proposal[order[1].w.id][d]=shifts[1].name+' '+shifts[1].time;
        }else if(numWorkers===1){
            proposal[order[0].w.id][d]=shifts[0].name+' '+shifts[0].time+' / '+shifts[1].name+' '+shifts[1].time;
        }
        // Ako ima 3+ radnika, treći dobiva međusmjenu ili slobodno
        if(numWorkers>=3){
            proposal[order[2].w.id][d]=shifts[2].name+' '+shifts[2].time;
        }
    }
    // Ako je pon-sub, nedjelja je svima slobodna
    if(workdaysSetting==='pon-sub'){
        workers.forEach(w=>{ proposal[w.id][6]='Slobodno'; });
    }
    // Ako je pon-ned, slobodni dani se ravnomjerno rotiraju kroz svih 7 dana
    if(workdaysSetting==='pon-ned'){
        // Slobodan dan rotira po danima tjedna, ravnomjerno
        for(let d=0; d<days; d++){
            let w = workers[d % workers.length];
            proposal[w.id][d] = 'Slobodno';
        }
    }
    // Korekcija sati: nitko ne smije imati više od 40h, svi što bliže istom broju
    function getHours(arr){
        return arr.reduce((acc,s)=>{
            if(!s||s.toLowerCase().includes('slob'))return acc;
            if(s.includes('Jutarnja'))acc+=7;
            if(s.includes('Popodnevna'))acc+=7;
            if(s.includes('Međusmjena'))acc+=4;
            return acc;
        },0);
    }
    // Ako netko ima više od 40h, zamijeni međusmjenu za slobodno dok ne dođe do 40h
    workers.forEach(w=>{
        let arr=proposal[w.id];
        while(getHours(arr)>40){
            let idx=arr.findIndex(s=>s&&s.includes('Međusmjena'));
            if(idx!==-1)arr[idx]='Slobodno';
            else break;
        }
    });
    // Ako netko ima manje od targeta, a može dobiti međusmjenu, dodaj
    workers.forEach(w=>{
        let arr=proposal[w.id];
        while(getHours(arr)<target){
            let idx=arr.findIndex(s=>!s||s==='Slobodno');
            if(idx!==-1)arr[idx]='Međusmjena 12:00-16:00';
            else break;
        }
    });
    schedule.proposal={shifts:proposal,generatedAt:Date.now(),source:'heuristic-equal'};
    return {proposal:schedule.proposal,warnings:null};
}

// AI proposal via OpenAI chat completion - returns { proposal, warnings } or { error }
async function aiProposeWithOpenAI(schedule, opts={}){
    const cur = (window.ssAuth && ssAuth.getCurrentUser && ssAuth.getCurrentUser()) || null;
    if (!cur || cur.id !== schedule.ownerId) return { error: 'Nemate ovlasti' };

    const apiKey = opts.apiKey || null;
    if (!apiKey) return { error: 'API ključ OpenAI je potreban' };

    const model = opts.model || 'gpt-4o-mini';

    // prepare a compact JSON input for the model
    const input = {
        meta: { code: schedule.code, ownerId: schedule.ownerId },
        companySettings: schedule.companySettings || {},
        workers: schedule.workers.map(w=>({ id: w.id, name: w.name, notes: w.notes||'' })),
        existingShifts: schedule.shifts || {}
    };

    const system = `You are a scheduling assistant. Produce a JSON object with a top-level field "shifts" mapping worker ids to an array of 7 shift strings (empty string for free). Respect company settings: openTime, closeTime, weeklyLimit (hours), requireFreeDay (boolean), and shiftTemplates (array of {name,time}). Use template strings exactly like "{name} {time}". If you cannot assign a shift without violating constraints, leave the cell empty. Return only JSON or wrap it inside markdown code fences with JSON.`;

    const userPrompt = `Input:\n${JSON.stringify(input, null, 2)}\n\nReturn JSON like: { "shifts": { "<workerId>": ["DayShift", ...], ... }, "notes": ["...warnings..."] }`;

    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ model, messages: [ { role: 'system', content: system }, { role: 'user', content: userPrompt } ], max_tokens: 800, temperature: 0.2 })
        });
        if (!res.ok) {
            const txt = await res.text();
            return { error: `OpenAI error: ${res.status} ${txt}` };
        }
        const data = await res.json();
        const msg = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ? data.choices[0].message.content : null;
        if (!msg) return { error: 'Nema odgovora od OpenAI' };

        // try to extract JSON
        let jsonText = msg.trim();
        const codeFence = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeFence) jsonText = codeFence[1].trim();

        let parsed = null;
        try { parsed = JSON.parse(jsonText); } catch(e){
            // try to find a JSON substring
            const start = jsonText.indexOf('{');
            const last = jsonText.lastIndexOf('}');
            if (start !== -1 && last !== -1) {
                try { parsed = JSON.parse(jsonText.slice(start, last+1)); } catch(e2) { return { error: 'Ne mogu parsirati JSON iz odgovora OpenAI' }; }
            } else {
                return { error: 'Ne mogu parsirati JSON iz odgovora OpenAI' };
            }
        }

        if (!parsed.shifts) return { error: 'OpenAI odgovor nema polje "shifts"' };

        // basic validation of structure
        const proposal = parsed.shifts;
        const warnings = parsed.notes || [];

        // ensure all workers exist and arrays length 7
        for (let w of schedule.workers){
            if (!proposal[w.id]) proposal[w.id] = Array(7).fill('');
            if (!Array.isArray(proposal[w.id]) || proposal[w.id].length !== 7) return { error: `Neispravan format za radnika ${w.name}` };
        }

        // attach proposal
        schedule.proposal = { shifts: proposal, generatedAt: Date.now(), source: 'openai', model };

        // validate against company settings and collect warnings
        const temp = JSON.parse(JSON.stringify(schedule));
        temp.shifts = proposal;
        const validation = validateScheduleAgainstCompanySettings(temp);
        const combinedWarnings = (warnings && warnings.length) ? warnings.slice() : [];
        if (validation && validation.length) combinedWarnings.push(...validation);

        return { proposal: schedule.proposal, warnings: combinedWarnings.length ? combinedWarnings : null };

    } catch (e) {
        return { error: 'Greška poziva OpenAI: ' + e.message };
    }
}

function acceptProposal(schedule){
    const cur = (window.ssAuth && ssAuth.getCurrentUser && ssAuth.getCurrentUser()) || null;
    if (!cur || cur.id !== schedule.ownerId) return { error: 'Nemate ovlasti' };
    if (!schedule.proposal) return { error: 'Nema prijedloga' };
    if (schedule.status === 'locked') return { error: 'Raspored je zaključan' };

        const newShifts = {};
        for (const wid in schedule.proposal.shifts) {
            newShifts[wid] = Array.isArray(schedule.proposal.shifts[wid]) ? schedule.proposal.shifts[wid].map(x => x || '') : Array(7).fill('');
        }
        schedule.shifts = newShifts;
    delete schedule.proposal;
    updateSchedule(schedule);
    return { ok: true };
}

// set schedule status: draft | published | locked
function setScheduleStatus(schedule, status){
    const cur = (window.ssAuth && ssAuth.getCurrentUser && ssAuth.getCurrentUser()) || null;
    if (!cur || cur.id !== schedule.ownerId) return { error: 'Nemate ovlasti' };
    if (!['draft','published','locked'].includes(status)) return { error: 'Neispravan status' };
    schedule.status = status;
    schedule.audit = schedule.audit || [];
    schedule.audit.push({ action: status, by: cur.id, at: Date.now() });
    updateSchedule(schedule);
    return { ok: true };
}

// Export to window
window.ssSchedules = {
    createSchedule,
    getScheduleByCode,
    getScheduleById,
    getSchedulesByOwner,
    updateSchedule,
    collectWorkersFromDOM,
    renderScheduleTable,
    aiAnalyzeSchedule,
    aiProposeSchedule,
    aiProposeWithOpenAI,
    acceptProposal,
    setScheduleStatus,
    _getSchedules // for debugging
};
