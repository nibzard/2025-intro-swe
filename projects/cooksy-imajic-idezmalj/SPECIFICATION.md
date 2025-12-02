# Cooksy - Recipe web application

## Contents
- [1. Project Overview](#1-project-overview)
- [2. Scope & Requirements](#2-scope--requirements)
- [3. Technical Architecture](#3-technical-architecture)
- [4. Data Design (The Domain Model)](#4-data-design-the-domain-model)
- [5. Interface Specifications](#5-interface-specifications)
- [6. Functional Specifications (Module breakdown)](#6-functional-specifications-module-breakdown)
- [7. Development Plan & Milestones](#7-development-plan--milestones)
- [8. Testing & Quality Strategy](#8-testing--quality-strategy)
- [9. Future Improvements (Roadmap)](#9-future-improvements-roadmap)

## 1. Project Overview
*   **Project Name & Working Title:** Cooksy
*   **Version / Date:** v0.1.0 Baseline, 2025-12-01
*   **High-Level Goal:** Cooksy is a web application developed using the Next.js framework that allows 
    users to search for and save recipes. Each recipe has a detailed page with information about 
    ingredients, instructions, preparation and cooking times and other relevant details. 
    Users can save their favorite recipes and view them in their personal favorites list.
*   **Core Value Proposition:** Provide users with a simple and clear platform for finding recipes that follows basic 
    design principles, ensuring easy navigation. Unlike many existing cooking websites that are often cluttered and unclear, 
    Cooksy offers a clean, intuitive and user-friendly interface.

## 2. Scope & Requirements
### 2.1 Goals (In-Scope)
* Home page
  * Header and footer
  * Recipe overview
  * Recipe search

* Recipes
  * Recipe overview
  * Filtering by categories and ingredients

* Favorites
  * Add recipes to favorites
  * Remove recipes from favorites

* Login
  * Google account login

* 404 / Not Found page

* Loading page

* Database connection
  * Supabase

* API data fetching
  * https://github.com/Ovi/DummyJSON/blob/master/database/recipes.json

### 2.2 Non-Goals (Out-of-Scope)
* Offline mode support
* AI-generated recipe suggestions
* Mobile version
* Registration with username and password

### 2.3 User Personas
* Persona 1: Marija, working mother

    * Details: 35 years old, lives in a city, full-time job, mother of two

    * Goals: Find quick and simple recipes with limited ingredients, save favorite recipes

    * Motivation: Spend less time in the kitchen while preparing healthy meals

    * Challenges: Limited time, picky children

    * Functionalities: Ingredient filtering, favorite recipes list, quick meal categories

* Persona 2: Marko, budget-conscious student

    * Details: 21 years old, studying in another city, lives in dorms

    * Goals: Find affordable and simple recipes

    * Motivation: Reduce food expenses, learn simple recipes

    * Challenges: Limited budget, lack of cooking experience

    * Functionalities: Ingredient filtering, beginner-friendly recipes, cost calculation

* Persona 3: Vesna, passionate cook

    * Details: 50 years old, lives in the countryside, enjoys cooking

    * Goals: Find inspiration for new recipes, save seasonal recipes

    * Motivation: Fulfill her passion for cooking and experimenting

    * Challenges: Limited access to exotic ingredients, wants to share recipes

    * Functionalities: Recommendations based on past searches, seasonal ingredient filtering, social recipe sharing

## 3. Technical Architecture
### 3.1 Tech Stack & Rationale
*   **Language/Runtime:** JavaScript
*   **Frameworks:** Next.js, Tailwind CSS
*   **Storage:** Supabase
*   **Rationale:** Enables fast, modern and easy development of a web application with a responsive interface and reliable user data storage.

### 3.2 High-Level Architecture

Frontend <-> API <-> Database (Supabase)

* **Frontend:** React + Next.js + Tailwind CSS
  * Displays user interface
  * Responsive design for desktop and mobile browsers

* **Backend (Server-side functionality):** Next.js API routes
  * Managing favorites (add, remove, fetch)
  * Communication with Supabase database and external API
  * Processing and filtering data before sending to the frontend

* **Database / Storage:** Supabase
  * Stores user data and favorites

### 3.3 Project Directory Structure
* This project directory structure will be updated and expanded as the project progresses.
    ```text
    cooksy/
      ├── app/
      │   ├── api/
      │   ├── storage/
      │   └── components/
      ├── SPECIFICATION.md
      └── README.md
    ```
### 3.4 Application Structure Diagram
![Application Structure](https://github.com/maiva667/2025-intro-swe/blob/f879cfea803744f7f1082ee48a345e04c402f468/projects/cooksy-imajic-idezmalj/sitemap.png)

## 4. Data Design (The Domain Model)
*   **Core Entities:** Recipes, User
*   **Schema / Data Structure:**
    * JSON Schema for recipes
    ```text
    "id": 1,
    "name": "Classic Margherita Pizza",
    "ingredients": [
      "Pizza dough",
      "Tomato sauce",
      "Fresh mozzarella cheese",
      "Fresh basil leaves",
      "Olive oil",
      "Salt and pepper to taste"
    ],
    "instructions": [
      "Preheat the oven to 475°F (245°C).",
      "Roll out the pizza dough and spread tomato sauce evenly.",
      "Top with slices of fresh mozzarella and fresh basil leaves.",
      "Drizzle with olive oil and season with salt and pepper.",
      "Bake in the preheated oven for 12-15 minutes or until the crust is golden brown.",
      "Slice and serve hot."
    ],
    "prepTimeMinutes": 20,
    "cookTimeMinutes": 15,
    "servings": 4,
    "difficulty": "Easy",
    "cuisine": "Italian",
    "caloriesPerServing": 300,
    "tags": [
      "Pizza",
      "Italian"
    ],
    "userId": 166,
    "image": "https://cdn.dummyjson.com/recipe-images/1.webp",
    "rating": 4.6,
    "reviewCount": 98,
    "mealType": [
      "Dinner"
    ]

    
## 5. Interface Specifications
### API / Web App:
*   **Endpoints:** 
    * GET /api/favorites
    * POST /api/favorites
    * DELETE /api/favorites
    
*   **Request/Response bodies:** 

## 6. Functional Specifications (Module breakdown)
* **Module A: Recipe fetch and display**  
  * **Purpose:** Fetch recipes from the external API and display them on the page.  
  * **Inputs:** API URL: https://github.com/Ovi/DummyJSON/blob/master/database/recipes.json  
  * **Processing / Logic:**  
    1. Call API endpoint to fetch recipes.  
    2. Validate each recipe object: check required fields (`id`, `name`, ...).  
    3. Render recipes in the UI.  
  * **Edge Cases / Error Handling:**  
    - API fails → show “Failed to load recipes” message.   

* **Module B: Favorites manager**  
  * **Purpose:** Allow users to add/remove recipes from favorites.  
  * **Inputs:** Recipe ID, user ID.  
  * **Processing / Logic:**  
    1. Check if user is logged in.  
    2. If logged in, check if recipe is already in favorites.  
       - If not, add to Supabase favorites table.  
       - If yes, ignore or remove if user clicks “remove”.  
    3. Update UI to reflect current favorites.  
  * **Edge Cases / Error Handling:**  
    - Recipe already in favorites → show message “Recipe already saved”.  
    - Supabase error / network error → show “Action failed, try again” message.   

* **Module C: User authentication**  
  * **Purpose:** Handle user login before allowing favorites.  
  * **Inputs:** User login status.  
  * **Processing / Logic:**  
    1. When the user clicks the heart icon on a recipe card to save it to favorites, the application checks the login status first. 
    2. If not logged in → redirect to Google login page.  
    3. If logged in → allow adding/removing favorites.  
  * **Edge Cases / Error Handling:**  
    - Login fails → show “Login failed, try again” message.  
    - Session expires → require login before next favorite action.   

* **Module D: Recipe filtering and search**  
  * **Purpose:** Filter and search recipes by category, ingredients and other parameters.  
  * **Inputs:** User-selected filters (category, ingredients, etc.).  
  * **Processing / Logic:**  
    1. Take all fetched recipes and apply filters.  
    2. Sort / arrange results if necessary.  
    3. Render filtered list in the UI.  
  * **Edge Cases / Error Handling:**  
    - No results → display “No recipes match your criteria”. 

## 7. Development Plan & Milestones
* ### Milestone 1 (Skeleton)
    Set up Next.js project and create low-fidelity and high-fidelity prototypes.

* ### Milestone 2 (Core Logic)
    Add navigation; fetch and display recipes from the API; implement search and filtering; enable adding and removing favorites (API + Supabase); implement Google login.

* ### Milestone 3 (Interface)
    Design recipe cards; open individual recipes in a modal window; create favorites page; implement loading page and 404 page.

* ### Milestone 4 (Polish)
    Add error handling across the app; complete final documentation.

## 8. Testing & Quality Strategy
*   **Performance Targets:** Screenshot of performance

## 9. Future Improvements (Roadmap)
*   Mobile version
