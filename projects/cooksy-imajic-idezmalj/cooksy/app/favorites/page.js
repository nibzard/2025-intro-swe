"use client";

import { useEffect, useState } from "react";
import RecipeCardContent from "../components/RecipeCardContent";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);

  const fetchFavorites = () => {
    fetch("/api/favorites")
      .then(res => res.json())
      .then(data => setFavorites(data ?? []))
      .catch(() => setFavorites([]));
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Favorite Recipes
      </h1>

      {favorites.length === 0 && <p>No saved recipes yet.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {favorites.map((recipe, index) => (
          <div
            key={recipe.id}
            className="flex flex-col w-full bg-white shadow-md hover:shadow-lg rounded-xl"
          >
            <RecipeCardContent
              recipe={recipe}
              priority={index === 0}
              onFavoriteChange={fetchFavorites}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
