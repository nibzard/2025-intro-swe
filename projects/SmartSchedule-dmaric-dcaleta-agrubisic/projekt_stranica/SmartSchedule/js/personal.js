// personal.js - Unos dostupnosti radnika

document.addEventListener('DOMContentLoaded', function() {
  const session = JSON.parse(sessionStorage.getItem('sessionUser'));
  if (!session) return;
  const days = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];
  const personalSchedule = document.getElementById('personalSchedule');
  const codeInput = document.getElementById('scheduleCodeInput');
  const loadBtn = document.getElementById('loadScheduleBtn');
  function prikaziRasporedZaKod() {
    if (!codeInput) return;
    const code = codeInput.value.trim().toUpperCase();
    if (!code) { personalSchedule.innerHTML = '<span style="color:#f55;">Unesite kod.</span>'; return; }
    const allSchedules = JSON.parse(localStorage.getItem('allSchedules') || '{}');
    const scheduleInfo = allSchedules[code];
    if (!scheduleInfo || !scheduleInfo.schedule) { personalSchedule.innerHTML = '<span style="color:#f55;">Ne postoji raspored za taj kod.</span>'; return; }
    const schedule = scheduleInfo.schedule;
    const workers = Array.isArray(scheduleInfo.workers) ? scheduleInfo.workers : [];
    let html = '';
    html += `<div style='margin-bottom:12px;font-weight:bold;color:#3a7afe;'>Naziv rasporeda: <span style='color:#fff;'>${scheduleInfo.name || '(bez naziva)'}</span><br>Kod: <span style='color:#fff;'>${code}</span></div>`;
    html += `<table class='schedule-table' style='width:100%;border-collapse:collapse;margin-top:8px;'>`;
    html += `<tr style='background:#232837;color:#fff;'>`;
    html += `<th style='padding:8px 12px;border:1px solid #232837;'>Radnik</th>`;
    days.forEach(d => { html += `<th style='padding:8px 12px;border:1px solid #232837;'>${d}</th>`; });
    html += `</tr>`;
    workers.forEach(w => {
      const workerKey = w.username + '#' + w.id;
      html += `<tr>`;
      html += `<td style='padding:8px 12px;border:1px solid #232837;background:#20243a;color:#3a7afe;font-weight:bold;'>${workerKey}</td>`;
      if (schedule[workerKey]) {
        days.forEach((d, di) => {
          html += `<td style='padding:8px 12px;border:1px solid #232837;background:#181c24;color:#fff;text-align:center;'>${schedule[workerKey][di] || ''}</td>`;
        });
      } else {
        days.forEach(() => { html += `<td style='padding:8px 12px;border:1px solid #232837;background:#181c24;'></td>`; });
      }
      html += `</tr>`;
    });
    html += `</table>`;
    personalSchedule.innerHTML = html;
  }
  if (loadBtn) loadBtn.onclick = prikaziRasporedZaKod;
});
