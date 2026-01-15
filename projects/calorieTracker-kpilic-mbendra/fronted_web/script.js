let meals = [];
let dailyGoal = 2000;
let macrosChart;

document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('macrosChart').getContext('2d');
    macrosChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['P', 'M', 'U'], datasets: [{ data: [0,0,0], backgroundColor: ['#4ade80','#fbbf24','#3b82f6'], borderWidth: 0, cutout: '80%' }]},
        options: { plugins: { legend: { display: false } }, maintainAspectRatio: false }
    });

    document.getElementById('calculate-tdee-btn').onclick = startApp;
    document.getElementById('set-manual-goal-btn').onclick = setManualGoal;
    document.getElementById('add-meal-btn').onclick = addTextMeal;
    document.getElementById('analyze-btn').onclick = addImageMeal;
    document.getElementById('back-to-profile-btn').onclick = () => {
        document.getElementById('phase-2-diary').style.display = 'none';
        document.getElementById('phase-1-profile').style.display = 'block';
        
    };
});
function setManualGoal() {
    const manualKcal = document.getElementById('daily-goal').value;
    if (manualKcal && manualKcal > 0) {
        dailyGoal = parseInt(manualKcal);
        // Prebaci na dnevnik
        document.getElementById('phase-1-profile').style.display = 'none';
        document.getElementById('phase-2-diary').style.display = 'grid';
        render(); // Osvježi prikaz s novim ciljem
    } else {
        alert("Molimo unesite ispravan broj kalorija u polje Dnevni cilj.");
    }
}

async function startApp() {
    const data = { age: 25, weight: 80, height: 180, target_weight: 75, activity: 'moderately_active' };
    const res = await fetch('http://127.0.0.1:5000/api/calculate_tdee', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
    const result = await res.json();
    if(result.success) {
        dailyGoal = result.recommended_kcal;
        document.getElementById('daily-goal').value = dailyGoal;
        
        // Možemo ispisati poruku korisniku
        console.log("Vaš bazalni metabolizam (BMR) je: " + result.bmr + " kcal");
        document.getElementById('phase-1-profile').style.display = 'none';
        document.getElementById('phase-2-diary').style.display = 'grid';
        render();
    }
}

async function addTextMeal() {
    const meal_name = document.getElementById('meal-name').value;
    const grams = document.getElementById('grams').value;
    const category = document.getElementById('text-meal-category').value; // Uzima iz prvog selecta

    const res = await fetch('http://127.0.0.1:5000/api/lookup_meal', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ meal_name, grams }) });
    const data = await res.json();
    if(data.success) {
        meals.push({...data, category});
        render();
    }
}

async function addImageMeal() {
    const file = document.getElementById('meal-image-file').files[0];
    const category = document.getElementById('image-meal-category').value; // Uzima iz drugog selecta

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
    ['Doručak', 'Ručak', 'Večera'].forEach(id => document.getElementById(`log-${id}`).innerHTML = '');
    let totals = { kcal: 0, p: 0, f: 0, c: 0 };

    meals.forEach((m, i) => {
        totals.kcal += m.calories; totals.p += m.protein; totals.f += m.fat; totals.c += m.carbs;
        const li = document.createElement('li');
        li.className = 'meal-card';
        li.innerHTML = `<div><b>${m.name}</b><br>${m.calories} kcal</div><button onclick="removeMeal(${i})">×</button>`;
        document.getElementById(`log-${m.category}`).appendChild(li);
    });

    document.getElementById('kcal-val').innerText = totals.kcal.toFixed(0);
    document.getElementById('remain-val').innerText = (dailyGoal - totals.kcal).toFixed(0);
    macrosChart.data.datasets[0].data = [totals.p * 4, totals.f * 9, totals.c * 4];
    macrosChart.update();
}

window.removeMeal = (i) => { meals.splice(i, 1); render(); };