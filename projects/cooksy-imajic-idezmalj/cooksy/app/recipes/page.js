"use client";

import { useState, useEffect } from "react";
import RecipeCardContent from "../components/RecipeCardContent";
import Loading from "../loading";
import FilterBar from "../components/FilterBar";

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [offset, setOffset] = useState(15);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    mealType: "",
    minCalories: null,
    selectedIngredient: "",
    ingredientsSearch: "",
  });

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/Ovi/DummyJSON/master/database/recipes.json")
      .then(res => res.json())
      .then(data => {
        setRecipes(Array.isArray(data) ? data : data.recipes || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);
    
  const filteredRecipes = recipes.filter(recipe => {
    if (
      filters.mealType &&
      recipe.mealType &&
      !recipe.mealType
        .map(mt => mt.toLowerCase())
        .includes(filters.mealType.toLowerCase())
    ) {
      return false;
    }

    if (
      filters.minCalories !== null &&
      recipe.caloriesPerServing &&
      recipe.caloriesPerServing < filters.minCalories
    ) {
      return false;
    }

    if (filters.selectedIngredient) {
      const ok = recipe.ingredients?.some(ing =>
        ing.toLowerCase().includes(filters.selectedIngredient.toLowerCase())
      );
      if (!ok) return false;
    }

    if (filters.ingredientsSearch.trim()) {
      const ok = recipe.ingredients?.some(ing =>
        ing.toLowerCase().includes(filters.ingredientsSearch.toLowerCase())
      );
      if (!ok) return false;
    }

    return true;
  });

  const visibleRecipes = filteredRecipes.slice(0, offset);

  if (isLoading) return <Loading />;

  return (
    <>
      <div className="w-full max-w-[1600px] mx-auto mt-16 px-4 sm:px-6 md:px-10">
        <FilterBar onFilterChange={setFilters} />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-8">
          {visibleRecipes.map((recipe, index) => (
            <div
              key={recipe.id}
              className="flex flex-col w-full bg-white shadow-md hover:shadow-lg rounded-xl"
            >
              <RecipeCardContent recipe={recipe} priority={index === 0} />
            </div>
          ))}
        </div>

        <div className="flex justify-center my-6">
          {offset < filteredRecipes.length && (
            <button
              onClick={() => setOffset(prev => prev + 5)}
              className="bg-[#D7C0A9] text-black px-6 py-4 mt-12 rounded hover:bg-[#C4B192]"
            >
              Load more …
            </button>
          )}
        </div>
      </div>
    </>
  );
}
