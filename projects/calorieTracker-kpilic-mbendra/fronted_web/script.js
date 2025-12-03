// --- GLOBALNE VARIJABLE i KONSTANTE ---
const MEAL_FORM = document.getElementById('meal-form');
const MEAL_LIST = document.getElementById('meal-list');
const CURRENT_CALORIES_SPAN = document.getElementById('current-calories');
const STATUS_MESSAGE = document.getElementById('status-message');
const CALORIE_GOAL = 2000; 

const MEAL_PHOTO_INPUT = document.getElementById('meal-photo');
const ANALYZE_BUTTON = document.getElementById('analyze-btn');
const ANALYSIS_RESULT_DIV = document.getElementById('analysis-result');


// ---------------------- 1. Lokalno Spremanje Podataka (Baza) ----------------------

function getMeals() {
    const mealsJSON = localStorage.getItem('calorietrackerMeals');
    return mealsJSON ? JSON.parse(mealsJSON) : [];
}

function saveMeals(meals) {
    localStorage.setItem('calorietrackerMeals', JSON.stringify(meals));
}

// ---------------------- 2. Prikaz i Izračun ----------------------

function updateSummary() {
    const meals = getMeals();
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    CURRENT_CALORIES_SPAN.textContent = totalCalories;

    const remaining = CALORIE_GOAL - totalCalories;
    STATUS_MESSAGE.classList.remove('status-ok', 'status-warning', 'status-over');

    if (remaining > 500) {
        STATUS_MESSAGE.classList.add('status-ok');
        STATUS_MESSAGE.innerHTML = `Ostalo: <strong>${remaining} kcal</strong>. Dobro je!`;
    } else if (remaining >= 0) {
        STATUS_MESSAGE.classList.add('status-warning');
        STATUS_MESSAGE.innerHTML = `Ostalo: <strong>${remaining} kcal</strong>. Prihvatljivo.`;
    } else {
        STATUS_MESSAGE.classList.add('status-over');
        STATUS_MESSAGE.innerHTML = `Premašeno za: <strong>${Math.abs(remaining)} kcal</strong>. Cilj premašen.`;
    }
}

function renderMeals() {
    const meals = getMeals();
    MEAL_LIST.innerHTML = '';
    
    meals.forEach(meal => {
        const li = document.createElement('li');
        li.dataset.id = meal.id;
        li.innerHTML = `
            ${meal.name} (${meal.calories} kcal) 
            <button class="remove-btn">X</button>
        `;
        MEAL_LIST.appendChild(li);
    });
    updateSummary();
}

// ---------------------- 3. Glavna logika (Samo simulacija unosa) ----------------------

function addMealPlaceholder(event) { 
    event.preventDefault(); 
    
    // Ovo je samo simulacija - dodaje hardkodirani obrok
    const mealName = document.getElementById('meal-name').value.trim();
    const caloriesInput = document.getElementById('calorie-amount').value.trim();
    
    if (mealName && caloriesInput) {
        const meals = getMeals();
        const newMeal = {
            id: Date.now(),
            name: mealName,
            calories: parseInt(caloriesInput, 10),
            date: new Date().toLocaleDateString(),
        };
        meals.push(newMeal);
        saveMeals(meals);
        renderMeals();
        MEAL_FORM.reset();
        return;
    }
    
    alert("Za sada implementirajte ručni unos imena i kalorija prije nego što dodamo backend logiku!");
}

function removeMeal(e) {
    if (e.target.classList.contains('remove-btn')) {
        const meals = getMeals();
        const mealId = parseInt(e.target.parentElement.dataset.id);
        const filteredMeals = meals.filter(meal => meal.id !== mealId);
        saveMeals(filteredMeals);
        renderMeals();
    }
}


// ---------------------- 4. Inicijalizacija i Event Listeners ----------------------

MEAL_FORM.addEventListener('submit', addMealPlaceholder);
MEAL_LIST.addEventListener('click', removeMeal);

//Resetiranje stanja pri osvježavanju stranice
localStorage.removeItem('calorietrackerMeals');

// Inicijalno učitavanje pri pokretanju
renderMeals();