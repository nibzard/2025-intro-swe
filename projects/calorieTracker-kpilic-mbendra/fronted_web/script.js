// --- GLOBALNE VARIJABLE ---
let meals = [];
let dailyGoal = localStorage.getItem('userDailyGoal') || 2000;
let macrosChart;

// --- INICIJALIZACIJA KOD UCITAVANJA ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Postavljanje kalendara
    const datePicker = document.getElementById('date-picker');
    if (datePicker) {
        datePicker.valueAsDate = new Date();
        datePicker.onchange = loadUserMeals;
    }

    // 2. Inicijalizacija grafikona
    const ctx = document.getElementById('macrosChart').getContext('2d');
    macrosChart = new Chart(ctx, {
        type: 'doughnut',
        data: { 
            labels: ['P', 'M', 'U'], 
            datasets: [{ 
                data: [0, 0, 0], 
                backgroundColor: ['#4ade80', '#fbbf24', '#3b82f6'], 
                borderWidth: 0, 
                cutout: '80%' 
            }]
        },
        options: { 
            plugins: { legend: { display: false } }, 
            maintainAspectRatio: false 
        }
    });

    // 3. Provjera statusa prijave
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const email = localStorage.getItem('userEmail');

    if (isLoggedIn && email) {
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        
        if (localStorage.getItem('userDailyGoal')) {
            prikaziDnevnik();
            loadUserMeals(); 
        }
    }

    // 4. Povezivanje tipki (Event Listeners)
    document.getElementById('auth-form').onsubmit = handleAuth;
    document.getElementById('calculate-tdee-btn').onclick = startApp;
    document.getElementById('set-manual-goal-btn').onclick = setManualGoal;
    document.getElementById('add-meal-btn').onclick = addTextMeal;
    document.getElementById('analyze-btn').onclick = addImageMeal;
    document.getElementById('logout-btn').onclick = logout;

    const backBtn = document.getElementById('back-to-profile-btn');
    if(backBtn) {
        backBtn.onclick = () => {
            document.getElementById('phase-2-diary').style.display = 'none';
            document.getElementById('phase-1-profile').style.display = 'block';
        };
    }
});

// --- NAVIGACIJA ---
function prikaziDnevnik() {
    document.getElementById('phase-1-profile').style.display = 'none';
    document.getElementById('phase-2-diary').style.display = 'grid';
    render();
}

function logout() {
    localStorage.clear();
    location.reload();
}

// --- AUTENTIKACIJA ---
async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    try {
        const res = await fetch('http://127.0.0.1:5000/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, password })
        });
        const result = await res.json();

        if (result.success) {
            ulazUAplikaciju(result.email, result.daily_kcal);
        } else {
            const regRes = await fetch('http://127.0.0.1:5000/api/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email, password })
            });
            const regResult = await regRes.json();
            if (regResult.success) {
                ulazUAplikaciju(email, 0);
            } else {
                alert(regResult.message);
            }
        }
    } catch (err) {
        console.error("Auth error:", err);
    }
}

function ulazUAplikaciju(email, kalorijeIzBaze) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';

    if (kalorijeIzBaze && kalorijeIzBaze > 0) {
        dailyGoal = kalorijeIzBaze;
        localStorage.setItem('userDailyGoal', dailyGoal);
        prikaziDnevnik();
    } else {
        document.getElementById('phase-1-profile').style.display = 'block';
        document.getElementById('phase-2-diary').style.display = 'none';
    }
    loadUserMeals();
}

// --- RAD S OBROCIMA ---
async function loadUserMeals() {
    const email = localStorage.getItem('userEmail');
    const dateInput = document.getElementById('date-picker');
    if (!email || !dateInput) return;

    try {
        const res = await fetch(`http://127.0.0.1:5000/api/get_meals?email=${email}&date=${dateInput.value}`);
        const data = await res.json();
        meals = data || [];
        render(); 
    } catch (err) {
        console.error("Load error:", err);
    }
}

async function addTextMeal() {
    const meal_name = document.getElementById('meal-name').value;
    const grams = document.getElementById('grams').value;
    const category = document.getElementById('text-meal-category').value;
    const userEmail = localStorage.getItem('userEmail');

    if (!meal_name || !grams) return alert("Popuni polja!");

    const res = await fetch('http://127.0.0.1:5000/api/lookup_meal', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ meal_name, grams }) 
    });
    const data = await res.json();

    if(data.success) {
        const mealWithCategory = {...data, category};
        await fetch('http://127.0.0.1:5000/api/add_meal', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ user_email: userEmail, meal: mealWithCategory })
        });
        loadUserMeals(); 
        document.getElementById('meal-name').value = '';
        document.getElementById('grams').value = '';
    }
}

async function addImageMeal() {
    const fileInput = document.getElementById('meal-image-file');
    const category = document.getElementById('image-meal-category').value;
    if(!fileInput.files[0]) return alert("Odaberi sliku!");

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    
    const res = await fetch('http://127.0.0.1:5000/api/analyze_meal', { method: 'POST', body: formData });
    const data = await res.json();

    if(data.success) {
        const mealWithCategory = {...data, category};
        await fetch('http://127.0.0.1:5000/api/add_meal', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_email: localStorage.getItem('userEmail'), meal: mealWithCategory })
        });
        loadUserMeals();
    }
}

window.removeMeal = async (dbId) => {
    if(!confirm("Obrisati obrok?")) return;
    await fetch(`http://127.0.0.1:5000/api/delete_meal/${dbId}`, { method: 'DELETE' });
    loadUserMeals();
};

async function obrisiSveZaDanas() {
    const email = localStorage.getItem('userEmail');
    const date = document.getElementById('date-picker').value;
    if(!confirm("Obrisati cijeli dan?")) return;
    
    await fetch(`http://127.0.0.1:5000/api/delete_all_meals?email=${email}&date=${date}`, { method: 'DELETE' });
    loadUserMeals();
}

// --- TDEE I CILJEVI ---
async function startApp() {
    const userEmail = localStorage.getItem('userEmail');
    const data = { 
        age: document.getElementById('user-age').value, 
        weight: document.getElementById('user-weight').value, 
        height: document.getElementById('user-height').value, 
        target_weight: document.getElementById('target-weight').value, 
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
        localStorage.setItem('userDailyGoal', dailyGoal);
        await fetch('http://127.0.0.1:5000/api/save_goal', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: userEmail, kcal: dailyGoal })
        });
        prikaziDnevnik();
    }
}

function setManualGoal() {
    const val = document.getElementById('daily-goal').value;
    if(val > 0) {
        dailyGoal = parseInt(val);
        localStorage.setItem('userDailyGoal', dailyGoal);
        prikaziDnevnik();
    }
}

// --- RENDER ---
function render() {
    ['Doručak', 'Ručak', 'Večera', 'Užina'].forEach(id => {
        const el = document.getElementById(`log-${id}`);
        if(el) el.innerHTML = '';
    });
    
    let totals = { kcal: 0, p: 0, f: 0, c: 0 };
    
    meals.forEach((m, i) => {
        totals.kcal += (m.calories || 0);
        totals.p += (m.protein || 0);
        totals.f += (m.fat || 0);
        totals.c += (m.carbs || 0);

        const list = document.getElementById(`log-${m.category}`);
        if(list) {
            const li = document.createElement('li');
            li.className = 'meal-card';
            li.innerHTML = `
                <div><b>${m.name}</b><br><small>${m.calories} kcal</small></div>
                <button onclick="removeMeal(${m.id})">×</button>
            `;
            list.appendChild(li);
        }
    });

    document.getElementById('kcal-val').innerText = totals.kcal.toFixed(0);
    document.getElementById('remain-val').innerText = (dailyGoal - totals.kcal).toFixed(0);
    
    if(macrosChart) {
        macrosChart.data.datasets[0].data = [totals.p * 4, totals.f * 9, totals.c * 4];
        macrosChart.update();
    }
}