<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', () => {
    // --- Dohvat Elemenata Aplikacije ---
    const mealNameInput = document.getElementById('meal-name');
    const caloriesInput = document.getElementById('calories');
    const gramsInput = document.getElementById('grams');
    const addMealBtn = document.getElementById('add-meal-btn');
    const mealLog = document.getElementById('meal-log');
    const totalCaloriesDisplay = document.getElementById('total-calories');
    const totalProteinDisplay = document.getElementById('total-protein');
    const totalFatDisplay = document.getElementById('total-fat');
    const totalCarbsDisplay = document.getElementById('total-carbs');
    const dailyGoalInput = document.getElementById('daily-goal');
    const goalStatus = document.getElementById('goal-status');
    const clearLogBtn = document.getElementById('clear-log-btn');
    const analysisResult = document.getElementById('analysis-result'); 
    const mealImageFile = document.getElementById('meal-image-file');
    const analyzeBtn = document.getElementById('analyze-btn');
    const analysisResultImage = document.getElementById('analysis-result-image'); 
    
    // Uklanjamo sve Supabase varijable i funkcije

    let dailyGoal = Number(dailyGoalInput.value) || 2000;
    let meals = []; 

    // ===================================================
    // FUNKCIJE ZA DNEVNIK I STATISTIKU
    // ===================================================

    function calculateTotals() {
        const totals = meals.reduce((acc, meal) => {
            acc.calories += meal.calories;
            acc.protein += meal.protein;
            acc.fat += meal.fat;
            acc.carbs += meal.carbs;
            return acc;
        }, { calories: 0, protein: 0, fat: 0, carbs: 0 });

        totalCaloriesDisplay.textContent = totals.calories.toFixed(0);
        totalProteinDisplay.textContent = totals.protein.toFixed(1);
        totalFatDisplay.textContent = totals.fat.toFixed(1);
        totalCarbsDisplay.textContent = totals.carbs.toFixed(1);

        const remaining = dailyGoal - totals.calories;
        goalStatus.textContent = remaining >= 0 
            ? `Preostalo: ${remaining.toFixed(0)} kcal.` 
            : `Prekoračeno: ${Math.abs(remaining).toFixed(0)} kcal.`;
        
        goalStatus.style.color = remaining >= 0 ? 'green' : 'red';
    }

    function renderMealLog() {
        mealLog.innerHTML = ''; 
        meals.forEach((meal, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span class="meal-name">${meal.name}</span>
                <span class="meal-stats">
                    ${meal.calories.toFixed(0)} kcal | 
                    P: ${meal.protein.toFixed(1)}g | 
                    M: ${meal.fat.toFixed(1)}g | 
                    U: ${meal.carbs.toFixed(1)}g
                </span>
                <button class="delete-btn" data-index="${index}">X</button>
            `;
            mealLog.appendChild(listItem);
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', deleteMeal);
        });
        calculateTotals();
    }
    
    function addMealToLog(name, calories, protein, fat, carbs) {
        const meal = {
            name: name,
            calories: Math.max(0, calories),
            protein: Math.max(0, protein),
            fat: Math.max(0, fat),
            carbs: Math.max(0, carbs)
        };
        
        meals.push(meal);
        renderMealLog();
    }

    function deleteMeal(event) {
        const index = event.target.dataset.index;
        meals.splice(index, 1);
        renderMealLog();
    }
    
    function clearInputs() {
        mealNameInput.value = '';
        caloriesInput.value = '';
    }

    // ===================================================
    // LOGIKA ZA UNOS OBROKA (Manualno + AI)
    // ===================================================

    async function lookupMeal(mealName, grams) {
        try {
            const response = await fetch('http://localhost:5000/api/lookup_meal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meal_name: mealName, grams: grams })
            });

            if (response.status === 404) { return null; }
            const data = await response.json();
            if (data.success) { return data; } else { alert(`Greška: ${data.error}`); return null; }
        } catch (error) {
            analysisResult.textContent = 'Greška pri komunikaciji s Backendom za pretragu.';
            console.error('Fetch error for lookup:', error);
            return null;
        }
    }


    async function lookupAndAddMeal() {
        const mealName = mealNameInput.value.trim();
        const calories = caloriesInput.value.trim();
        
        const gramsValue = gramsInput.value.trim();
        const finalGrams = Number(gramsValue) || 100;

        if (finalGrams <= 0) {
            alert('Količina (g) mora biti pozitivna vrijednost.');
            gramsInput.focus();
            return;
        }

        // 1. Prioritet: Ručni unos (Ako su uneseni Naziv i Kalorije)
        if (mealName && calories) {
             const baseCalories = Number(calories) || 0;
            
            if (baseCalories <= 0) {
                alert('Kalorije po 100g moraju biti veće od nule za ručni unos.');
                caloriesInput.focus();
                return;
            }

            const finalCalories = (baseCalories / 100) * finalGrams;
            const factor = finalGrams / 100;
            // Simuliramo makronutrijente za ručni unos (približni omjeri)
            const simulatedProtein = (baseCalories * 0.15) / 4 * factor; 
            const simulatedFat = (baseCalories * 0.10) / 9 * factor;
            const simulatedCarbs = (baseCalories * 0.30) / 4 * factor;

            addMealToLog(
                `${mealName} (Ručni unos, ${finalGrams}g)`, 
                finalCalories,
                simulatedProtein, 
                simulatedFat,     
                simulatedCarbs    
            ); 
            
            analysisResult.textContent = 'Ručni unos dodan.';
            clearInputs();
            return; 
        }

        // 2. Prioritet: Pretraživanje po imenu (Ako je unesen samo Naziv)
        if (mealName && !calories) {
            analysisResult.textContent = 'Pretraživanje simulirane baze...';
            const result = await lookupMeal(mealName, finalGrams);
            
            if (result) {
                addMealToLog(result.name, result.calories, result.protein, result.fat, result.carbs);
                analysisResult.textContent = `Obrok ${result.name} (${result.calories.toFixed(0)} kcal) dodan.`; 
            } else {
                alert('Namirnica nije pronađena u bazi. Molimo unesite Kalorije (kcal / 100g) za ručni unos.');
                analysisResult.textContent = 'Namirnica nije pronađena.';
            }
            clearInputs();
            return;
        }
        
        alert('Molimo unesite Naziv i Kalorije/100g te Količinu (g) za ručni unos ili pretraživanje.');
        clearInputs();
    }


    async function analyzeImage() {
        const file = mealImageFile.files[0];
        if (!file) {
            alert("Molimo odaberite sliku za analizu.");
            return;
        }

        analysisResultImage.textContent = 'Analiza slike u tijeku... (ovo može potrajati 5-15 sekundi)';
        analyzeBtn.disabled = true;

        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const response = await fetch('http://localhost:5000/api/analyze_meal', {
                method: 'POST',
                body: formData 
            });

            const data = await response.json();

            if (data.success) {
                addMealToLog(
                    data.name,
                    data.calories,
                    data.protein,
                    data.fat,
                    data.carbs
                );
                
                analysisResultImage.textContent = `AI analiza uspješna! Obrok ${data.name} (${data.calories.toFixed(0)} kcal) dodan.`;
            } else {
                analysisResultImage.textContent = `Greška u AI analizi: ${data.error}`;
                alert(`Greška: ${data.error}`);
            }

        } catch (error) {
            analysisResultImage.textContent = 'Greška pri komunikaciji s Backendom za analizu slike.';
            console.error('Fetch error for image analysis:', error);
        } finally {
            analyzeBtn.disabled = false;
        }
    }


    // ===================================================
    // LISTENERI
    // ===================================================

    addMealBtn.addEventListener('click', lookupAndAddMeal);
    analyzeBtn.addEventListener('click', analyzeImage);
    
    clearLogBtn.addEventListener('click', () => {
        meals = [];
        renderMealLog();
        alert('Dnevnik je obrisan.');
    });

    dailyGoalInput.addEventListener('input', () => {
        dailyGoal = Number(dailyGoalInput.value) || 0;
        calculateTotals();
    });

    // Početno učitavanje
    renderMealLog();
});
=======
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
>>>>>>> 04342a810ea5441727877f814c8d4fc9141799b1
