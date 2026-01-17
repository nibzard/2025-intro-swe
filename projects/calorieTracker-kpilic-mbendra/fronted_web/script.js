let meals = [];
let dailyGoal = 2000;
let macrosChart;

// 1. PROVJERA PRIJAVE (Odmah pri učitavanju)
if (localStorage.getItem('isLoggedIn') === 'true') {
    // Ako je korisnik već prijavljen, sakrij login čim se stranica učita
    const style = document.createElement('style');
    style.innerHTML = '#auth-overlay { display: none !important; } #app-container { display: block !important; }';
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', () => {
    // --- INICIJALIZACIJA GRAFIKONA ---
    const ctx = document.getElementById('macrosChart').getContext('2d');
    macrosChart = new Chart(ctx, {
        type: 'doughnut',
        data: { 
            labels: ['P', 'M', 'U'], 
            datasets: [{ 
                data: [0,0,0], 
                backgroundColor: ['#4ade80','#fbbf24','#3b82f6'], 
                borderWidth: 0, 
                cutout: '80%' 
            }]
        },
        options: { 
            plugins: { legend: { display: false } }, 
            maintainAspectRatio: false 
        }
    });

    // --- LOGIKA ZA PRIJAVU / REGISTRACIJU ---
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;

            try {
                // Pokušaj prijave
                const res = await fetch('http://127.0.0.1:5000/api/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, password })
                });
                const result = await res.json();

                if (result.success) {
                    ulazUAplikaciju(email);
                } else {
                    // Ako prijava ne uspije, automatski pokušaj registraciju
                    const regRes = await fetch('http://127.0.0.1:5000/api/register', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ email, password })
                    });
                    const regResult = await regRes.json();
                    
                    if (regResult.success) {
                        alert("Registracija uspješna!");
                        ulazUAplikaciju(email);
                    } else {
                        alert(regResult.message);
                    }
                }
            } catch (err) {
                alert("Greška: Provjeri je li Python (app.py) pokrenut!");
            }
        };
    }
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userEmail');
            location.reload(); // Ponovno učitaj stranicu da se prikaže Login
        };
    }

    function ulazUAplikaciju(email) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
    }

    // --- TVOJE ORIGINALNE FUNKCIJE ---
    document.getElementById('calculate-tdee-btn').onclick = startApp;
    document.getElementById('set-manual-goal-btn').onclick = setManualGoal;
    document.getElementById('add-meal-btn').onclick = addTextMeal;
    document.getElementById('analyze-btn').onclick = addImageMeal;
    
    document.getElementById('back-to-profile-btn').onclick = () => {
        document.getElementById('phase-2-diary').style.display = 'none';
        document.getElementById('phase-1-profile').style.display = 'block';
    };
});

// --- POMOĆNE FUNKCIJE ZA KALORIJE ---
function setManualGoal() {
    const manualKcal = document.getElementById('daily-goal').value;
    if (manualKcal && manualKcal > 0) {
        dailyGoal = parseInt(manualKcal);
        document.getElementById('phase-1-profile').style.display = 'none';
        document.getElementById('phase-2-diary').style.display = 'grid';
        render();
    } else {
        alert("Unesite ispravan broj kalorija.");
    }
}

async function startApp() {
    const data = { 
        age: document.getElementById('user-age').value || 25, 
        weight: document.getElementById('user-weight').value || 80, 
        height: document.getElementById('user-height').value || 180, 
        target_weight: document.getElementById('target-weight').value || 75, 
        activity: document.getElementById('user-activity').value 
    };
    const res = await fetch('http://127.0.0.1:5000/api/calculate_tdee', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(data) 
    });
    const result = await res.json();
    if(result.success) {
        dailyGoal = result.recommended_kcal;
        document.getElementById('daily-goal').value = dailyGoal;
        document.getElementById('phase-1-profile').style.display = 'none';
        document.getElementById('phase-2-diary').style.display = 'grid';
        render();
    }
}

async function addTextMeal() {
    const meal_name = document.getElementById('meal-name').value;
    const grams = document.getElementById('grams').value;
    const category = document.getElementById('text-meal-category').value;

    const res = await fetch('http://127.0.0.1:5000/api/lookup_meal', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ meal_name, grams }) 
    });
    const data = await res.json();
    if(data.success) {
        meals.push({...data, category});
        render();
    }
}

async function addImageMeal() {
    const file = document.getElementById('meal-image-file').files[0];
    if(!file) return alert("Odaberi sliku!");
    const category = document.getElementById('image-meal-category') ? document.getElementById('image-meal-category').value : 'Ručak';

    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('http://127.0.0.1:5000/api/analyze_meal', { method: 'POST', body: formData });
    const data = await res.json();
    if(data.success) {
        meals.push({...data, category});
        render();
    }
}

function render() {
    ['Doručak', 'Ručak', 'Večera'].forEach(id => {
        const el = document.getElementById(`log-${id}`);
        if(el) el.innerHTML = '';
    });
    
    let totals = { kcal: 0, p: 0, f: 0, c: 0 };

    meals.forEach((m, i) => {
        totals.kcal += m.calories; totals.p += m.protein; totals.f += m.fat; totals.c += m.carbs;
        const li = document.createElement('li');
        li.className = 'meal-card';
        li.innerHTML = `<div><b>${m.name}</b><br>${m.calories} kcal</div><button onclick="removeMeal(${i})">×</button>`;
        const targetLog = document.getElementById(`log-${m.category}`);
        if(targetLog) targetLog.appendChild(li);
    });

    document.getElementById('kcal-val').innerText = totals.kcal.toFixed(0);
    document.getElementById('remain-val').innerText = (dailyGoal - totals.kcal).toFixed(0);
    macrosChart.data.datasets[0].data = [totals.p * 4, totals.f * 9, totals.c * 4];
    macrosChart.update();
}

window.removeMeal = (i) => { meals.splice(i, 1); render(); };