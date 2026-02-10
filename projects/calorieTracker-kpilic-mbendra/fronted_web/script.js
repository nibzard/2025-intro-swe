let meals = [];
let dailyGoal = 2000;

document.addEventListener('DOMContentLoaded', () => {
    const datePicker = document.getElementById('date-picker');
    if (datePicker) {
        datePicker.valueAsDate = new Date();
        datePicker.onchange = loadUserMeals;
    }

    if (localStorage.getItem('isLoggedIn') === 'true') {
        ulazUAplikaciju(localStorage.getItem('userEmail'), localStorage.getItem('userDailyGoal') || 0);
    }

    // Gumbi
    document.getElementById('login-btn').onclick = login;
    document.getElementById('register-btn').onclick = register;
    document.getElementById('calculate-tdee-btn').onclick = startApp;
    document.getElementById('add-meal-btn').onclick = addTextMeal;
    document.getElementById('analyze-btn').onclick = addImageMeal;
    document.getElementById('logout-btn').onclick = logout;
});

// --- AUTENTIKACIJA I ULAZ ---

async function login() {
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
            alert(result.message);
        }
    } catch (err) {
        alert("Greška na serveru!");
    }
}

async function register() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const res = await fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password })
    });
    const result = await res.json();
    alert(result.message);
}

function ulazUAplikaciju(email, kcal) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userDailyGoal', kcal);
    
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
  
    if (parseInt(kcal) > 0) {
        dailyGoal = parseInt(kcal);
        document.getElementById('phase-1-profile').style.display = 'none';
        document.getElementById('phase-2-diary').style.display = 'grid';
        loadUserMeals();
    } else {
        document.getElementById('phase-1-profile').style.display = 'block';
        document.getElementById('phase-2-diary').style.display = 'none';
    }
}

document.getElementById('set-manual-goal-btn').addEventListener('click', async function() {
    
    const rucniUnos = document.getElementById('daily-goal').value;
    const email = localStorage.getItem('userEmail');

    if (!rucniUnos || rucniUnos <= 0) {
        alert("Unesite pozitivan broj! ");
        return;
    }

    try {
        // 2. Šaljemo taj broj u bazu preko tvoje /api/save_goal rute
        const response = await fetch('http://127.0.0.1:5000/api/save_goal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                kcal: parseInt(rucniUnos),
                // Šaljemo nule za ostalo jer ovo radimo ručno
                height: 0, weight: 0, age: 0 
            })
        });

        const result = await response.json();
        
        if (result.success) {
            // 3. Spremi u browser i "leti" u dnevnik
            localStorage.setItem('userDailyGoal', rucniUnos);
            
            // Koristimo tvoju funkciju za ulaz
            ulazUAplikaciju(email, rucniUnos);
            
            console.log("Ručni cilj postavljen na: " + rucniUnos);
        } else {
            alert("Greška kod spremanja: " + result.error);
        }
    } catch (err) {
        console.error("gRESKa", err);
    }
});

async function startApp() {
    const age = document.getElementById('user-age').value;
    const weight = document.getElementById('user-weight').value;
    const height = document.getElementById('user-height').value;
    const target_weight = document.getElementById('target-weight').value;
    const activity = document.getElementById('user-activity').value;
    const email = localStorage.getItem('userEmail');

    try {
        const res = await fetch('http://127.0.0.1:5000/api/calculate_tdee', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ age, weight, height, target_weight, activity })
        });
        const result = await res.json();
        
        if(result.success) {
            const kcal = result.recommended_kcal;
            
            // Slanje u bazu (ovdje je pucalo na slici image_6fe280)
            const saveRes = await fetch('http://127.0.0.1:5000/api/save_goal', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    email, 
                    kcal, // Šaljemo izračunati cilj
                    age,
                    weight,
                    height,
                    activity
                })
            });
            if(saveRes.ok) {
                // KLJUČNI DIO: Odmah ažuriraj localStorage i prebaci ekran
                localStorage.setItem('userDailyGoal', kcal); 
                ulazUAplikaciju(email, kcal); // Ova funkcija će sad sakriti Fazu 1
            }
            
            
        }
    } catch (err) { console.error("Greška:", err); }
}

// --- RAD S OBROCIMA ---

async function loadUserMeals() {
    const email = localStorage.getItem('userEmail');
    const date = document.getElementById('date-picker').value;
    const res = await fetch(`http://127.0.0.1:5000/api/get_meals?email=${email}&date=${date}`);
    meals = await res.json() || [];
    render();
}

async function addTextMeal() {
    const name = document.getElementById('meal-name').value;
    const grams = document.getElementById('grams').value;
    const category = document.getElementById('text-meal-category').value;
    const date = document.getElementById('date-picker').value;

    const resLookup = await fetch('http://127.0.0.1:5000/api/lookup_meal', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ meal_name: name, grams })
    });
    const data = await resLookup.json();

    if(data.success) {
        await fetch('http://127.0.0.1:5000/api/add_meal', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_email: localStorage.getItem('userEmail'), meal: {...data, category}, date })
        });
        document.getElementById('meal-name').value = ''; 
        document.getElementById('grams').value = '';
        loadUserMeals();
    }
}

async function addImageMeal() {
    const file = document.getElementById('meal-image-file').files[0];
    const category = document.getElementById('image-meal-category').value;
    const date = document.getElementById('date-picker').value;
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('http://127.0.0.1:5000/api/analyze_meal', { method: 'POST', body: formData });
    const data = await res.json();

    if(data.success) {
        await fetch('http://127.0.0.1:5000/api/add_meal', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_email: localStorage.getItem('userEmail'), meal: {...data, category}, date })
        });
        
        document.getElementById('meal-image-file').value = "";
        
        loadUserMeals();
    }
}

// --- PRIKAZ ---

function render() {
    let totals = { kcal: 0, p: 0, f: 0, c: 0 };
    ['Doručak', 'Ručak', 'Večera', 'Užina'].forEach(id => document.getElementById(`log-${id}`).innerHTML = '');

    meals.forEach(m => {
        totals.kcal += m.calories;
        totals.p += m.protein; totals.f += m.fat; totals.c += m.carbs;
        
        const listEl = document.getElementById(`log-${m.category}`);
    if (listEl) {
        listEl.innerHTML += `
        <div style="background: #222; color: white; padding: 10px 15px; margin-bottom: 8px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #7c4dff;">
            <div style="display: flex; flex-direction: column;">
                <span style="font-weight: bold; font-size: 15px;">${m.name}</span>
                <span style="font-size: 13px; color: #bbb;">${m.calories} kcal</span>
            </div>
            <button onclick="obrisiJedanObrok('${m.id}')" 
                    style="background: #ff4d4d; color: white; border: none; border-radius: 6px; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; cursor: pointer; font-weight: bold; transition: 0.3s;">
                x
            </button>
        </div>`;
    }
    }
);

    updateCalorieCircle(totals.kcal, dailyGoal);
    updateMacrosCircle(totals.p, totals.c, totals.f);
    // Ažuriranje teksta pored P, U, M krugova koristeći tvoje ID-ove iz HTML-a
    document.getElementById('p-val-leg').innerText = Math.round(totals.p);
    document.getElementById('c-val-leg').innerText = Math.round(totals.c);
    document.getElementById('f-val-leg').innerText = Math.round(totals.f);

    const totalKcalElem = document.getElementById('total-macros-weight');
    if (totalKcalElem) {
        totalKcalElem.innerText = Math.round(totals.kcal);
    }

    // 2. Makronutrijenti pored malih krugova
    // Koristimo ID-ove koje vidim u tvom HTML-u: p-val-leg, c-val-leg, f-val-leg
    const pElem = document.getElementById('p-val-leg');
    const cElem = document.getElementById('c-val-leg');
    const fElem = document.getElementById('f-val-leg');

    if (pElem) pElem.innerText = Math.round(totals.p);
    if (cElem) cElem.innerText = Math.round(totals.c);
    if (fElem) fElem.innerText = Math.round(totals.f);
}

function updateCalorieCircle(consumed, goal) {
    const remaining = goal - consumed;
    const display = document.getElementById('calories-left-number');
    
    if (display) {
        display.innerText = remaining > 0 ? Math.round(remaining) : 0;
    }
}

function updateMacrosCircle(p, c, f) {
    const total = p + c + f || 1;
    const pP = (p / total) * 100;
    const cP = (c / total) * 100;
    document.getElementById('macros-circle').style.background = `conic-gradient(#3b82f6 0% ${pP}%, #f59e0b ${pP}% ${pP+cP}%, #ef4444 ${pP+cP}% 100%)`;
}

document.getElementById('back-to-profile-btn').addEventListener('click', function() {
    // 1. Sakrij cijeli dnevnik
    document.getElementById('phase-2-diary').style.display = 'none';
    
    // 2. Pokaži formu za profil (Faza 1)
    document.getElementById('phase-1-profile').style.display = 'block';
    
    // 3. Resetiramo dnevni cilj u localStorageu na 0 
    // kako bi nas aplikacija pustila da ponovo unesemo podatke
    localStorage.setItem('userDailyGoal', '0');
    
    console.log("Povratak na promjenu cilja...");
});

async function obrisiSveZaDanas() {
    if(!confirm("Obrisati?")) return;
    
    const email = localStorage.getItem('userEmail');
    const date = document.getElementById('date-picker').value;

    try {
        const res = await fetch(`http://127.0.0.1:5000/api/delete_meals?email=${email}&date=${date}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            meals = []; // Isprazni lokalnu listu
            render();   // Ponovno nacrtaj (bit će sve na 0)
            alert("Baza očišćena!");
        }
    } catch (err) {
        console.error("Greška:", err);
    }
}

async function obrisiJedanObrok(id) {
    if(!confirm("Obrisati ovaj obrok?")) return;

    try {
        const res = await fetch(`http://127.0.0.1:5000/api/delete_single_meal?id=${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            // Ponovno učitaj sve iz baze da se krugovi i lista osvježe
            await loadUserMeals();
            prikaziPoruku("Obrok obrisan! 🗑️");
        }
    } catch (err) {
        console.error("Greška kod brisanja:", err);
    }
}

function prikaziPoruku(tekst) {
    const toast = document.getElementById('toast');
    toast.innerText = tekst;
    toast.style.display = 'block';

    // Sakrij poruku nakon 3 sekunde
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function logout() { localStorage.clear(); location.reload(); }