// personal.js - Unos dostupnosti radnika

document.addEventListener('DOMContentLoaded', function() {
  const session = JSON.parse(sessionStorage.getItem('sessionUser'));
  if (!session) return;
  const personalSchedule = document.getElementById('personalSchedule');
  const codeInput = document.getElementById('scheduleCodeInput');
  const loadBtn = document.getElementById('loadScheduleBtn');

  function prikaziRaspored() {
        // Funkcija za izračun sati po radniku
        function izracunajSatePoRadniku(scheduleInfo, workers, radniDani) {
          // Definiraj trajanje svake smjene u satima
          const SATI_MAP = {
            "Jutro": 7,
            "Međusmjena": 8,
            "Popodne": 7,
            "Morning": 7,
            "Afternoon": 7,
            "Slobodan": 0,
            "Off": 0
          };
          const rezultat = [];
          workers.forEach(w => {
            const workerKey = w.username + '#' + w.id;
            const dani = scheduleInfo.schedule[workerKey] || [];
            let ukupno = 0;
            dani.forEach(val => {
              ukupno += SATI_MAP[val] !== undefined ? SATI_MAP[val] : 0;
            });
            rezultat.push({ ime: workerKey, sati: ukupno });
          });
          return rezultat;
        }
    if (!codeInput) return;
    const code = codeInput.value.trim().toUpperCase();
    if (!code) { personalSchedule.innerHTML = '<span style="color:#f55;">Unesite kod.</span>'; return; }
    const allSchedules = JSON.parse(localStorage.getItem('allSchedules') || '{}');
    const scheduleInfo = allSchedules[code];
    let myKey = session.username + '#' + session.id;
    console.log('[DEBUG] Učitani scheduleInfo:', scheduleInfo);
    console.log('[DEBUG] Moj ključ (myKey):', myKey);
    if (!scheduleInfo || !scheduleInfo.business) { personalSchedule.innerHTML = '<span style="color:#f55;">Ne postoji raspored ili tvrtka za taj kod.</span>'; return; }
    let business = scheduleInfo.business;
    let radniDani = business.workDays == 7
      ? ["Ponedjeljak","Utorak","Srijeda","Četvrtak","Petak","Subota","Nedjelja"]
      : ["Ponedjeljak","Utorak","Srijeda","Četvrtak","Petak","Subota"];
    let html = `<div style='margin-bottom:12px;font-weight:bold;color:#3a7afe;'>Tvrtka: <span style='color:#fff;'>${business.name || '(bez naziva)'}</span><br>Radni dani: <span style='color:#fff;'>${radniDani.join(', ')}</span></div>`;
    const SHIFT_MAP = {
      "Jutro": "07:00 - 14:00",
      "Međusmjena": "10:00 - 15:00",
      "Popodne": "14:00 - 21:00",
      "Slobodan": "Slobodno",
      "Off": "Slobodno",
      "Morning": "07:00 - 14:00",
      "Afternoon": "14:00 - 21:00"
    };
    // Prikaz svih radnika
    let workers = Array.isArray(scheduleInfo.workers) ? scheduleInfo.workers.slice() : [];
    // Pronađi šeficu (isBoss)
    const sefRadnik = workers.find(w => w.isBoss);
    // Ako šefica nije u listi, pokušaj je pronaći u scheduleInfo.schedule
    if (!sefRadnik && scheduleInfo.schedule) {
      const bossKey = Object.keys(scheduleInfo.schedule).find(k => {
        // Pretpostavljamo da je šefica jedina koja ima isBoss true u nekoj drugoj strukturi, ili je prva u schedule
        return k.toLowerCase().includes('sef') || k.toLowerCase().includes('boss');
      });
      if (bossKey) {
        workers.unshift({ username: bossKey.split('#')[0], id: bossKey.split('#')[1], isBoss: true });
      }
    }
    // Uvijek prikaži šeficu prvu
    if (sefRadnik) {
      workers = [sefRadnik, ...workers.filter(w => !w.isBoss)];
    }
    if (!workers.length || !scheduleInfo.schedule) {
      html += `<div style='color:#e74c3c;font-weight:bold;'>Nema radnika ili rasporeda za prikaz.</div>`;
      personalSchedule.innerHTML = html;
          // AI feedback o satima
          const satiPoRadniku = izracunajSatePoRadniku(scheduleInfo, workers, radniDani);
          // Prosjek sati
          const prosjek = satiPoRadniku.reduce((a, b) => a + b.sati, 0) / (satiPoRadniku.length || 1);
          let aiFeedback = `<div style='margin-top:18px;padding:14px 18px;background:#20243a;border-radius:10px;color:#fff;'><b>AI analiza sati rada:</b><br>`;
          satiPoRadniku.forEach(r => {
            let diff = r.sati - prosjek;
            let boja = Math.abs(diff) < 0.1 ? '#27ae60' : (diff < 0 ? '#e67e22' : '#3a7afe');
            let poruka = diff < -0.1 ? ` treba nadoknaditi ${Math.abs(diff).toFixed(1)}h` : (diff > 0.1 ? ` radi ${diff.toFixed(1)}h više` : ' (ravnomjerno)');
            aiFeedback += `<span style='color:${boja};font-weight:bold;'>${r.ime}</span>: ${r.sati}h${poruka}<br>`;
          });
          aiFeedback += `<span style='color:#aaa;'>Prosjek sati: ${prosjek.toFixed(1)}h</span></div>`;
          personalSchedule.innerHTML += aiFeedback;
      return;
    }
    html += `<div id="scheduleTable"><table class="schedule-table-modern"><thead><tr><th>Radnik</th>`;
    radniDani.forEach(dan => { html += `<th>${dan}</th>`; });
    html += `</tr></thead><tbody>`;
    workers.forEach((w, wi) => {
      const workerKey = w.username + '#' + w.id;
      let stil = w.isBoss ? 'color:#ffd700;font-weight:600;text-align:left;' : 'color:#3a7afe;font-weight:600;text-align:left;';
      html += `<tr${wi%2===1 ? ' class="zebra"' : ''}><td style="${stil}display:flex;align-items:center;gap:8px;">${workerKey}${w.isBoss ? ' ⭐' : ''}</td>`;
      radniDani.forEach((dan, i) => {
        let val = (scheduleInfo.schedule[workerKey] && scheduleInfo.schedule[workerKey][i]) || '';
        let prikaz = SHIFT_MAP[val] || val || '-';
        html += `<td>${prikaz}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    personalSchedule.innerHTML = html;
    // Prikaži tablicu
    const tableDiv = document.getElementById("scheduleTable");
    if (tableDiv) tableDiv.style.display = "block";
  }

  if (loadBtn) loadBtn.onclick = prikaziRaspored;
});
