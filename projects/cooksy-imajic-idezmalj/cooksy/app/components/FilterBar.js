"use client";

import { useState, useEffect } from "react";

const allIngredients = [
  "egg","sugar","salt","butter","milk","cheese","flour",
  "olive oil","cinnamon","vanilla extract","tomato","onion","garlic"
];

const mealTypeOptions = [
  "Breakfast","Lunch","Dinner","Snack","Dessert","Brunch"
];

export default function FilterBar({ onFilterChange }) {
  const [mealType, setMealType] = useState("default");
  const [minCalories, setMinCalories] = useState("default");
  const [selectedIngredient, setSelectedIngredient] = useState("default");
  const [ingredientsSearch, setIngredientsSearch] = useState("");

  useEffect(() => {
    onFilterChange({
      mealType: mealType === "default" ? "" : mealType,
      minCalories: minCalories === "default" ? null : Number(minCalories),
      selectedIngredient:
        selectedIngredient === "default" ? "" : selectedIngredient,
      ingredientsSearch,
    });
  }, [mealType, minCalories, selectedIngredient, ingredientsSearch, onFilterChange]);

  return (
    <div className="bg-[#D7C0A9] p-4 rounded-lg w-full mb-8">
      <div className="flex flex-wrap lg:flex-nowrap items-start lg:items-center gap-4">

        <select
          className="p-2 bg-white rounded border border-[#4e664be8] text-[#253d24e8] text-sm"
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
        >
          <option value="">Meals</option>
          {mealTypeOptions.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select
          className="p-2 bg-white rounded border border-[#4e664be8] text-[#253d24e8] text-sm"
          value={minCalories}
          onChange={(e) => setMinCalories(e.target.value)}
        >
          <option value="">Calories</option>
          <option value="400">400+</option>
          <option value="300">300+</option>
          <option value="200">200+</option>
          <option value="100">100+</option>
        </select>

        <select
          className="p-2 bg-white rounded border border-[#4e664be8] text-[#253d24e8] text-sm"
          value={selectedIngredient}
          onChange={(e) => setSelectedIngredient(e.target.value)}
        >
          <option value="">Ingredients</option>
          {allIngredients.map(ing => (
            <option key={ing} value={ing}>{ing}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={ingredientsSearch}
          onChange={(e) => setIngredientsSearch(e.target.value)}
          className="p-3 bg-white rounded border border-[#4e664be8] text-[#253d24e8] text-sm w-60 ml-auto"
        />
      </div>
    </div>
  );
}
