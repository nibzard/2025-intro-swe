"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Star, Heart } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function RecipeCardContent({ recipe, priority = false, onFavoriteChange }) {
  const [liked, setLiked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkFavorite = async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("recipe_id", recipe.id)
        .single();

      setLiked(!!data);
    };

    checkFavorite();
  }, [recipe.id, user]);

  const toggleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("You must be logged in to save favorites");
      return;
    }

    if (!liked) {
      await supabase.from("favorites").insert({
        user_id: user.id,
        recipe_id: recipe.id,
        recipe: recipe,
      });
    } else {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("recipe_id", recipe.id);
    }

    setLiked(!liked);
    if (onFavoriteChange) onFavoriteChange();
  };

  return (
    <Link href={`/recipe/${recipe.id}`} className="relative block bg-white shadow-md hover:shadow-lg rounded-xl overflow-hidden">
      <button
        onClick={toggleLike}
        className="absolute top-3 right-3 bg-white/90 rounded-full p-2 shadow-md z-10"
      >
        <Heart className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
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
