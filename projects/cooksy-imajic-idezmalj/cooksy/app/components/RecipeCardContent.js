"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Star, Heart } from "lucide-react";

export default function RecipeCardContent({ recipe, priority = false, onFavoriteChange }) {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetch("/api/favorites")
      .then(res => res.json())
      .then(data => {
        const exists = data?.some(r => r.id === recipe.id);
        setLiked(exists);
      })
      .catch(() => {});
  }, [recipe.id]);

  const toggleLike = async (e) => {
    e.preventDefault();  
    e.stopPropagation(); 

    const newLiked = !liked;
    setLiked(newLiked);

    if (newLiked) {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipe),
      });
    } else {
      await fetch(`/api/favorites?id=${recipe.id}`, {
        method: "DELETE",
      });
    }
    if (onFavoriteChange) onFavoriteChange();
  };

  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="relative block bg-white shadow-md hover:shadow-lg rounded-xl overflow-hidden"
    >
      <button
        onClick={toggleLike}
        className="absolute top-3 right-3 bg-white/90 rounded-full p-2 shadow-md z-10"
      >
        <Heart
          className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : "text-gray-500"}`}
        />
      </button>
      <Image
        src={recipe.image || "/placeholder.png"}
        alt={recipe.name}
        width={400}
        height={300}
        className="w-full h-[240px] object-cover rounded-t-xl"
        priority={priority}
      />
      <div className="p-4">
        <h2 className="text-lg font-semibold text-black mb-1">{recipe.name}</h2>

        <div className="flex items-center gap-1 text-sm text-gray-700 mb-1">
          <Clock className="w-4 h-4" /> {recipe.prepTimeMinutes} min
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-700">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {recipe.rating}
        </div>
      </div>
    </Link>
  );
}
