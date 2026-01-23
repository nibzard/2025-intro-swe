// personal.js — manage personal availability per user

function _getPersonalKey(userId){
    return `ss_personal_${userId}`;
}

function getPersonalData(userId){
    try { return JSON.parse(localStorage.getItem(_getPersonalKey(userId)) || '{}'); }
    catch(e) { return {}; }
}

function savePersonalData(userId, data){
    localStorage.setItem(_getPersonalKey(userId), JSON.stringify(data));
}

// open a simple modal to edit free days for a selected month
function openMonthEditor(monthIndex){
    const user = ssAuth.getCurrentUser();
    if (!user) { location.href = 'index.html'; return; }

    const root = document.createElement('div');
    root.className = 'modal-root';
    root.style.position = 'fixed';
    root.style.left = 0; root.style.top = 0; root.style.right = 0; root.style.bottom = 0;
    root.style.background = 'rgba(0,0,0,0.4)';
    root.style.display = 'flex';
    root.style.alignItems = 'center';
    root.style.justifyContent = 'center';
    root.style.zIndex = 9999;

    const box = document.createElement('div');
    box.style.background = 'var(--bg)';
    box.style.padding = '20px';
    box.style.borderRadius = '8px';
    box.style.width = '320px';

    const title = document.createElement('h3');
    title.innerText = `Unos slobodnih dana (${monthIndex+1}). mjesec`;
    box.appendChild(title);

    const data = getPersonalData(user.id) || {};
    const monthData = data[monthIndex] || [];

    const label = document.createElement('div');
    label.style.marginTop = '8px';
    label.innerHTML = '<div style="color:var(--text-soft);">Upišite datume (npr. 2,5,6) ili ostavite prazno</div>';
    box.appendChild(label);

    const input = document.createElement('input');
    input.style.width = '100%';
    input.style.marginTop = '12px';
    input.value = (monthData || []).join(',');
    box.appendChild(input);

    const actions = document.createElement('div');
    actions.style.marginTop = '12px';
    actions.style.display = 'flex';
    actions.style.justifyContent = 'space-between';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn';
    saveBtn.innerText = 'Spremi';
    saveBtn.onclick = () => {
        const raw = input.value.trim();
        const arr = raw === '' ? [] : raw.split(',').map(s=>parseInt(s.trim())).filter(n=>!isNaN(n));
        const d = getPersonalData(user.id) || {};
        d[monthIndex] = arr;
        savePersonalData(user.id, d);
        document.body.removeChild(root);
        alert('Spremljeno');
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-gray';
    cancelBtn.innerText = 'Zatvori';
    cancelBtn.onclick = () => document.body.removeChild(root);

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    box.appendChild(actions);

    root.appendChild(box);
    document.body.appendChild(root);
}

// simple AI recommendation: find days with many free markers and recommend a date
function aiRecommendForPersonal(userId){
    const data = getPersonalData(userId) || {};
    // look next 3 months for dates that are not blocked
    const recs = [];
    for (let m=0; m<3; m++){
        const month = data[m] || [];
        // pick a day not in month list between 1..28
        let d = 1;
        while (month.includes(d) && d<=28) d++;
        if (d<=28) recs.push({month: m+1, day: d});
    }
    return recs; // array of {month,day}
}

window.ssPersonal = { openMonthEditor, getPersonalData, savePersonalData, aiRecommendForPersonal };
