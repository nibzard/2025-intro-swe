"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Clock, Star } from "lucide-react";
import Loading from "../../loading";

export default function RecipePage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/Ovi/DummyJSON/master/database/recipes.json")
      .then(res => res.json())
      .then(data => {
        const recipesArray = Array.isArray(data) ? data : data.recipes || [];
        const found = recipesArray.find(r => String(r.id) === id);
        setRecipe(found || null);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <Loading />;

  if (!recipe) return <p className="text-center mt-10 text-red-500">Recipe not found</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2 flex justify-center items-start">
          <Image
            src={recipe.image || "/placeholder.png"}
            alt={recipe.name}
            width={400}
            height={300}
            className="rounded-xl object-cover w-full max-w-sm shadow-md"
          />
        </div>
        <div className="md:w-1/2 flex flex-col">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-[#5B3705]">
            {recipe.name}
          </h1>

          <div className="flex items-center gap-6 mb-4 text-gray-700">
            <div className="flex items-center gap-1">
              <Clock className="w-5 h-5" /> {recipe.prepTimeMinutes} min
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" /> {recipe.rating}
            </div>
          </div>

          <h2 className="text-2xl font-semibold mt-4 mb-2 text-[#5B3705]">Ingredients</h2>
          <ul className="list-disc list-inside mb-4">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx}>{ing}</li>
            ))}
          </ul>

          {recipe.instructions && (
            <>
              <h2 className="text-2xl font-semibold mt-4 mb-2 text-[#5B3705]">Instructions</h2>
              <p className="text-gray-700">{recipe.instructions}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
