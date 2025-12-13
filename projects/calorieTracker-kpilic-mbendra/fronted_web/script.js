document.addEventListener('DOMContentLoaded', () => {

    // ===================================================
    // DOHVAT SVIH ELEMENATA (Mora biti unutar DOMContentLoaded)
    // ===================================================
    
    // Faze i TDEE elementi
    const phase1Profile = document.getElementById('phase-1-profile');
    const phase2Diary = document.getElementById('phase-2-diary');
    const calculateTDEEBtn = document.getElementById('calculate-tdee-btn');
    const tdeeResultMessage = document.getElementById('tdee-result-message');
    const skipTDEEBtn = document.getElementById('skip-tdee-btn');
    const userAgeInput = document.getElementById('user-age');
    const userWeightInput = document.getElementById('user-weight');
    const userHeightInput = document.getElementById('user-height');
    const userActivitySelect = document.getElementById('user-activity');
    const targetWeightInput = document.getElementById('target-weight');

    // Elementi za Ručni Unos
    const mealNameInput = document.getElementById('meal-name');
    const gramsInput = document.getElementById('grams');
    const addMealBtn = document.getElementById('add-meal-btn');
    const mealCategorySelect = document.getElementById('meal-category');
    
    // Elementi za Analizu Slike
    const mealImageFile = document.getElementById('meal-image-file');
    const analyzeBtn = document.getElementById('analyze-btn');
    const imageMealCategorySelect = document.getElementById('image-meal-category');
    const analysisResultImage = document.getElementById('analysis-result-image'); 
    
    // Dnevnik i Statistika
    const mealLog = document.getElementById('meal-log');
    const totalCaloriesDisplay = document.getElementById('total-calories-display');
    const totalProteinDisplay = document.getElementById('total-protein-display');
    const totalFatDisplay = document.getElementById('total-fat-display');
    const totalCarbsDisplay = document.getElementById('total-carbs-display');
    const dailyGoalInput = document.getElementById('daily-goal');
    const goalStatus = document.getElementById('goal-status');
    const clearLogBtn = document.getElementById('clear-log-btn');
    const backToProfileBtn = document.getElementById('back-to-profile-btn'); 
    const analysisResult = document.getElementById('analysis-result'); 

    // NOVO: Ciljevi Makronutrijenata
    const goalProteinInput = document.getElementById('goal-protein');
    const goalFatInput = document.getElementById('goal-fat');
    const goalCarbsInput = document.getElementById('goal-carbs');

    // NOVO: Trake Napretka
    const progressProtein = document.getElementById('progress-protein');
    const progressFat = document.getElementById('progress-fat');
    const progressCarbs = document.getElementById('progress-carbs');
    const progressProteinText = document.getElementById('progress-protein-text');
    const progressFatText = document.getElementById('progress-fat-text');
    const progressCarbsText = document.getElementById('progress-carbs-text');
    
    // ===================================================
    // GLOBALNE VARIJABLE
    // ===================================================

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

        // Ažuriranje brojeva
        totalCaloriesDisplay.textContent = totals.calories.toFixed(0);
        totalProteinDisplay.textContent = totals.protein.toFixed(1);
        totalFatDisplay.textContent = totals.fat.toFixed(1);
        totalCarbsDisplay.textContent = totals.carbs.toFixed(1);

        // Ažuriranje statusa kalorija
        const remaining = dailyGoal - totals.calories;
        goalStatus.textContent = remaining >= 0 
            ? `Preostalo: ${remaining.toFixed(0)} kcal.` 
            : `Prekoračeno: ${Math.abs(remaining).toFixed(0)} kcal.`;
        
        goalStatus.style.color = remaining >= 0 ? '#4CAF50' : '#FF5252'; 
        
        
        // ===============================================
        // NOVO: LOGIKA ZA TRAKE NAPRETKA (P/M/U)
        // ===============================================
        
        const goalProtein = Number(goalProteinInput.value) || 1;
        const goalFat = Number(goalFatInput.value) || 1;
        const goalCarbs = Number(goalCarbsInput.value) || 1;

        // Računanje postotaka (ograničavamo na 100%)
        const pPct = Math.min(100, (totals.protein / goalProtein) * 100);
        const fPct = Math.min(100, (totals.fat / goalFat) * 100);
        const cPct = Math.min(100, (totals.carbs / goalCarbs) * 100);

        // Ažuriranje širine traka
        progressProtein.style.width = `${pPct}%`;
        progressFat.style.width = `${fPct}%`;
        progressCarbs.style.width = `${cPct}%`;

        // Ažuriranje tekstualnog prikaza
        progressProteinText.textContent = 
            `${totals.protein.toFixed(1)}g / ${goalProtein}g (${pPct.toFixed(0)}%)`;
        progressFatText.textContent = 
            `${totals.fat.toFixed(1)}g / ${goalFat}g (${fPct.toFixed(0)}%)`;
        progressCarbsText.textContent = 
            `${totals.carbs.toFixed(1)}g / ${goalCarbs}g (${cPct.toFixed(0)}%)`;
    }

    function renderMealLog() {
        mealLog.innerHTML = ''; 
        meals.forEach((meal, index) => {
            const listItem = document.createElement('li');
            // Dodajemo klasu za lakše stiliziranje
            listItem.className = `meal-item meal-category-${meal.category.toLowerCase()}`; 
            listItem.innerHTML = `
                <span class="meal-category">${meal.category}:</span>
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

    function skipTDEE() {
    // Koristi se trenutna vrijednost u inputu za dnevni cilj
    dailyGoal = Number(dailyGoalInput.value) || 2000;
    calculateTotals();

    // Prijelaz na drugu fazu
    phase1Profile.style.display = 'none';
    phase2Diary.style.display = 'grid'; 
    tdeeResultMessage.textContent = 'Koristi se Vaš postavljeni cilj (Bez TDEE izračuna).';
    }
    
    function backToProfile() {
    phase2Diary.style.display = 'none';
    phase1Profile.style.display = 'block';
    tdeeResultMessage.textContent = 'Vratili ste se za izmjenu ciljeva.';
    }

    function addMealToLog(name, calories, protein, fat, carbs, category) {
        const meal = {
            name: name,
            calories: Math.max(0, calories),
            protein: Math.max(0, protein),
            fat: Math.max(0, fat),
            carbs: Math.max(0, carbs),
            category: category
        };
        
        meals.push(meal);
        renderMealLog();
    }

    function deleteMeal(event) {
        const index = event.target.dataset.index;
        meals.splice(index, 1);
        renderMealLog();
    }
    
    // ===================================================
    // LOGIKA ZA UNOS OBROKA (Manualno + AI)
    // ===================================================

    async function lookupMeal(mealName, grams) {
        try {
            // POZIV NA FLASK BACKEND
            const response = await fetch('http://localhost:5000/api/lookup_meal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meal_name: mealName, grams: grams })
            });

            if (!response.ok) {
                 // Čitanje error poruke s backenda
                const errorData = await response.json();
                alert(`Greška: ${errorData.error || 'Server error'}`);
                return null;
            }

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
        const gramsValue = gramsInput.value.trim();
        const finalGrams = Number(gramsValue) || 100;
        const selectedCategory = mealCategorySelect.value;
        
        if (!mealName) {
            alert('Molimo unesite Naziv Obroka.');
            mealNameInput.focus();
            return;
        }

        if (finalGrams <= 0) {
            alert('Količina (g) mora biti pozitivna vrijednost.');
            gramsInput.focus();
            return;
        }

        analysisResult.textContent = `Pretraživanje za ${mealName} (${finalGrams}g)...`;
        addMealBtn.disabled = true;

        try {
            const result = await lookupMeal(mealName, finalGrams);
            
            if (result) {
                addMealToLog(
                    result.name, 
                    result.calories, 
                    result.protein, 
                    result.fat, 
                    result.carbs,
                    selectedCategory
                );
                analysisResult.textContent = `Obrok "${result.name}" (${result.calories.toFixed(0)} kcal) dodan.`; 
            } else {
                 // Ako lookupMeal vrati null (zbog greške već prikazane alertom)
                analysisResult.textContent = 'Unos obroka neuspješan.';
            }

        } catch (error) {
            analysisResult.textContent = 'Greška pri komunikaciji s Backendom.';
            console.error('Fetch error for lookup:', error);
        } finally {
            addMealBtn.disabled = false;
        }
    }

    async function analyzeImage() {
        const file = mealImageFile.files[0];
        if (!file) {
            alert("Molimo odaberite sliku za analizu.");
            return;
        }

        const selectedCategory = imageMealCategorySelect.value;
        analysisResultImage.textContent = 'Analiza slike u tijeku...';
        analyzeBtn.disabled = true;

        const formData = new FormData();
        formData.append('image', file);
        
        try {
            // POZIV NA FLASK BACKEND
            const response = await fetch('http://localhost:5000/api/analyze_meal', {
                method: 'POST',
                body: formData 
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Greška u AI servisu: ${errorData.error || 'Server error'}`);
                return;
            }

            const data = await response.json();

            if (data.success) {
                addMealToLog(
                    data.name,
                    data.calories,
                    data.protein,
                    data.fat,
                    data.carbs,
                    selectedCategory
                );
                
                analysisResultImage.textContent = `Analiza uspješna! Obrok ${data.name} (${data.calories.toFixed(0)} kcal) dodan.`;
            } else {
                analysisResultImage.textContent = `Greška u analizi: ${data.error}`;
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
    // LOGIKA ZA KALKULACIJU DNEVNIH KALORIJA (TDEE)
    // ===================================================

    async function fetchTDEEFromBackend() {
        // Prikupljanje podataka s frontenda
        const userData = {
            age: Number(userAgeInput.value),
            weight: Number(userWeightInput.value),
            height: Number(userHeightInput.value),
            activity: userActivitySelect.value,
            target_weight: Number(targetWeightInput.value)
        };
        
        // Jednostavna validacija 
        if (userData.age <= 5 || userData.weight <= 10 || userData.height <= 50) {
            return { success: false, error: "Molimo unesite realne vrijednosti za dob, težinu i visinu." };
        }

        try {
            // Slanje POST zahtjeva na Flask backend
            const response = await fetch('http://localhost:5000/api/calculate_tdee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Greška: ${errorData.error || 'Server error'}`);
                return { success: false, error: "Greška pri komunikaciji s Backendom." };
            }

            return await response.json(); 
            
        } catch (error) {
            console.error('Fetch error for TDEE:', error);
            return { success: false, error: "Greška pri komunikaciji s Backendom. Provjerite radi li Flask aplikacija." };
        }
    }

    async function startApp() {
        const userAge = Number(userAgeInput.value);

        if (userAge < 5 || userAge > 100) {
            tdeeResultMessage.textContent = 'Upozorenje: Dob mora biti između 5 i 100 godina.';
            userAgeInput.focus();
            return; 
        }

        tdeeResultMessage.textContent = 'Izračunavanje preporučenih kalorija...';
        calculateTDEEBtn.disabled = true;

        const result = await fetchTDEEFromBackend();

        if (result.success) {
            const recommendedKcal = result.recommended_kcal;
            
            // 1. Ažuriranje dnevnog cilja
            dailyGoalInput.value = recommendedKcal;
            dailyGoal = recommendedKcal; 
            calculateTotals(); 

            // 2. Prikaz poruke i prijelaz
            tdeeResultMessage.innerHTML = `
                Preporučeni dnevni unos: <strong>${recommendedKcal} kcal</strong>.
                <br>${result.explanation}
            `;
            
            // Prijelaz na drugu fazu
            phase1Profile.style.display = 'none';
            phase2Diary.style.display = 'grid'; // Koristimo grid za novi layout

        } else {
            // Greška u izračunu
            tdeeResultMessage.textContent = `Greška: ${result.error}`;
            alert("Nije moguće izračunati cilj. Pokrenite aplikaciju s podrazumijevanom vrijednošću.");
            
            // Ako je greška, ipak prebaci fazu, ali koristi default vrijednost
            dailyGoalInput.value = 2000;
            dailyGoal = 2000;
            calculateTotals();
            
            phase1Profile.style.display = 'none';
            phase2Diary.style.display = 'grid'; 
        }
        calculateTDEEBtn.disabled = false;
    }

    // ===================================================
    // LISTENERI
    // ===================================================

    addMealBtn.addEventListener('click', lookupAndAddMeal);
    analyzeBtn.addEventListener('click', analyzeImage);
    calculateTDEEBtn.addEventListener('click', startApp);
    skipTDEEBtn.addEventListener('click', skipTDEE);
    
    // Listeneri za ciljeve (ažuriraju statistiku/trake kada se cilj promijeni)
    dailyGoalInput.addEventListener('input', () => {
        dailyGoal = Number(dailyGoalInput.value) || 0;
        calculateTotals();
    });
    
    // NOVO: Listeneri za ciljeve makronutrijenata
    goalProteinInput.addEventListener('input', calculateTotals);
    goalFatInput.addEventListener('input', calculateTotals);
    goalCarbsInput.addEventListener('input', calculateTotals);
    backToProfileBtn.addEventListener('click', backToProfile);


    clearLogBtn.addEventListener('click', () => {
        meals = [];
        renderMealLog();
        alert('Dnevnik je obrisan.');
    });

    // Početno učitavanje
    renderMealLog();
});