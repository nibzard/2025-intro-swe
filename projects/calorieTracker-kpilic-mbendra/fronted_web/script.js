document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // GLOBALNE VARIJABLE I ELEMENTI
    // ----------------------------------------------------
    const mealNameInput = document.getElementById('meal-name');
    const caloriesInput = document.getElementById('calories');
    const barcodeInput = document.getElementById('barcode'); 
    const gramsInput = document.getElementById('grams'); // Element za količinu (g)
    const addMealBtn = document.getElementById('add-meal-btn'); 
    const analyzeBtn = document.getElementById('analyze-btn'); 
    const mealImageFileInput = document.getElementById('meal-image-file');
    const mealLog = document.getElementById('meal-log'); 
    const analysisResult = document.getElementById('analysis-result');
    const clearLogBtn = document.getElementById('clear-log-btn');
    
    // Elementi za DNEVNI CILJ
    const dailyGoalInput = document.getElementById('daily-goal');
    const goalStatus = document.getElementById('goal-status');


    let meals = [];

    // --- LOKALNO SPREMANJE I UČITAVANJE ---
    function saveMeals() {
        localStorage.setItem('calorieTrackerMeals', JSON.stringify(meals));
    }

    function loadMeals() {
        const storedMeals = localStorage.getItem('calorieTrackerMeals');
        if (storedMeals) {
            meals = JSON.parse(storedMeals);
            meals.forEach(meal => renderMeal(meal));
        }
    }

    // --- LOGIKA ČIŠĆENJA (AGRESIVNO) ---
    const clearInputs = () => {
        mealNameInput.value = '';
        caloriesInput.value = '';
        gramsInput.value = '';
        barcodeInput.value = '';
    };

    // --- FUNKCIJA ZA STATISTIKU I CILJ ---
    function updateStats() {
        let totalCalories = 0;
        let totalProtein = 0;
        let totalFat = 0;
        let totalCarbs = 0;

        meals.forEach(meal => {
            totalCalories += meal.calories;
            totalProtein += meal.protein;
            totalFat += meal.fat;
            totalCarbs += meal.carbs;
        });

        // Ažuriranje prikaza statistike
        document.getElementById('total-calories').textContent = totalCalories.toFixed(0);
        document.getElementById('total-protein').textContent = totalProtein.toFixed(1);
        document.getElementById('total-fat').textContent = totalFat.toFixed(1);
        document.getElementById('total-carbs').textContent = totalCarbs.toFixed(1);
        
        // LOGIKA CILJA
        const dailyGoal = Number(dailyGoalInput.value) || 2000;

        if (totalCalories > dailyGoal) {
            goalStatus.textContent = `Prekoračili ste cilj za ${(totalCalories - dailyGoal).toFixed(0)} kcal!`;
            goalStatus.style.color = 'red';
        } else if (totalCalories > dailyGoal * 0.9) {
            goalStatus.textContent = `Blizu cilja! Preostalo: ${(dailyGoal - totalCalories).toFixed(0)} kcal.`;
            goalStatus.style.color = 'orange';
        } else {
            goalStatus.textContent = `Preostalo: ${(dailyGoal - totalCalories).toFixed(0)} kcal.`;
            goalStatus.style.color = 'green';
        }
    }
    
    // --- FUNKCIJE ZA DNEVNIK OBROKA ---
    function renderMeal(meal) {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            ${meal.name} (${meal.calories.toFixed(0)} kcal) 
            <small>P:${meal.protein.toFixed(1)}g, M:${meal.fat.toFixed(1)}g, UH:${meal.carbs.toFixed(1)}g</small>
            <button class="remove-btn" data-name="${meal.name}">X</button>
        `;
        mealLog.appendChild(listItem);
    }

    function addMealToLog(name, calories, protein = 0, fat = 0, carbs = 0) {
        const newMeal = {
            name: name,
            calories: Number(calories),
            protein: Number(protein),
            fat: Number(fat),
            carbs: Number(carbs)
        };
        meals.push(newMeal);

        renderMeal(newMeal);
        updateStats();
        saveMeals();
    }

    // --- ISKLJUČENE RUTE (Daju samo poruku) ---

    // Isključena Barkod Funkcionalnost
    async function lookupBarcode(barcode) {
        analysisResult.textContent = `Funkcionalnost barkoda je privremeno isključena. Molimo koristite ručni unos.`;
        clearInputs(); 
    }

    // Isključena Analiza Slike Funkcionalnost
    async function analyzeImage() {
        analysisResult.textContent = 'Analiza slike je privremeno isključena. Molimo koristite ručni unos.';
        mealImageFileInput.value = '';
        gramsInput.value = '';
    }

    // --- LOGIKA PRETRAŽIVANJA IMENA (Case 2) ---
    async function lookupMeal(mealName, grams) { 
        analysisResult.textContent = 'Pretraživanje simulirane baze...';
        try {
            const response = await fetch('http://localhost:5000/api/lookup_meal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meal_name: mealName, grams: grams }) 
            });

            const data = await response.json();

            if (data.success) {
                return data; 
            } else {
                analysisResult.textContent = `Greška: ${data.error}`;
                return null;
            }

        } catch (error) {
            analysisResult.textContent = 'Greška pri komunikaciji s Backendom.';
            console.error('Fetch error:', error);
            return null;
        }
    }

    // --- GLAVNA FUNKCIJA ZA UNOS I PRETRAŽIVANJE (FOKUS NA RUČNI UNOS) ---

    async function lookupAndAddMeal() {
        const mealName = mealNameInput.value.trim();
        let calories = caloriesInput.value.trim();
        const barcode = barcodeInput.value.trim(); 
        
        const gramsValue = gramsInput.value.trim();
        const finalGrams = Number(gramsValue) || 100; // Default 100 ako je prazno/0

        // 1. Prioritet: BARKOD (Isključeno)
        if (barcode) {
            alert('Funkcionalnost barkoda je isključena.');
            clearInputs();
            return; 
        }

        // 2. Pretraživanje po imenu ako kalorije nedostaju (Case 2)
        if (mealName && !calories) {
            const result = await lookupMeal(mealName, finalGrams);
            if (result) {
                addMealToLog(result.name, result.calories, result.protein, result.fat, result.carbs);
                analysisResult.textContent = `Obrok ${result.name} (${result.calories.toFixed(0)} kcal) dodan.`; 
            } else {
                // Ako pretraživanje nije uspjelo
                alert('Namirnica nije pronađena u bazi. Molimo unesite Kalorije (kcal / 100g) za ručni unos.');
            }
            clearInputs();
            return;
        }

        // 3. Ručni unos (GLAVNA FUNKCIONALNOST - Case 3)
        if (mealName && calories) {
            const baseCalories = Number(calories) || 0;
            
            if (baseCalories === 0) {
                 alert('Kalorije po 100g ne mogu biti nula pri ručnom unosu.');
                 clearInputs(); 
                 return;
            }

            const finalCalories = (baseCalories / 100) * finalGrams;
            
            // Izračun makronutrijenata
            const factor = finalGrams / 100;
            const simulatedProtein = (baseCalories * 0.15) / 4 * factor; 
            const simulatedFat = (baseCalories * 0.10) / 9 * factor;
            const simulatedCarbs = (baseCalories * 0.30) / 4 * factor;

            addMealToLog(
                `${mealName} (${finalGrams}g)`, 
                finalCalories,
                simulatedProtein, 
                simulatedFat,     
                simulatedCarbs    
            ); 
            
            analysisResult.textContent = 'Ručni unos dodan.';
            clearInputs();
        } else {
            alert('Molimo unesite Naziv i Kalorije/100g te Količinu (g).');
            clearInputs();
        }
    }


    // --- INICIJALIZACIJA I DOGAĐAJI ---

    mealLog.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const mealName = e.target.dataset.name;
            const index = meals.findIndex(m => m.name === mealName);
            
            if (index > -1) {
                meals.splice(index, 1);
                e.target.closest('li').remove();
                updateStats();
                saveMeals();
            }
        }
    });

    clearLogBtn.addEventListener('click', () => {
        if (confirm('Jeste li sigurni da želite obrisati cijeli dnevnik?')) {
            meals = [];
            localStorage.removeItem('calorieTrackerMeals');
            mealLog.innerHTML = ''; 
            updateStats();
        }
    });

    // Događaj za promjenu cilja
    dailyGoalInput.addEventListener('change', updateStats); 

    addMealBtn.addEventListener('click', lookupAndAddMeal);
    analyzeBtn.addEventListener('click', analyzeImage); // Ostaje za klik, ali funkcija je isključena

    // Učitavanje obroka pri pokretanju
    loadMeals();
    updateStats();
});