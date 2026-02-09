"use client";

import { useEffect, useState } from "react";
import RecipeCardContent from "../components/RecipeCardContent";
import { supabase } from "../lib/supabaseClient";
import Loading from "@/app/loading";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
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

    let active = true;

    const loadFavorites = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id);

      if (active) setFavorites(data ?? []);
      if (active) setLoading(false);
    };

    loadFavorites();

    return () => { active = false };
  }, [user]);

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-6">
      <p className="text-2xl md:text-3xl font-semibold mb-4 text-[#8F7355]">
        You must be logged in to see your favorites.
      </p>
      <a
        href="/login"
        className="bg-[#D7C0A9] text-black px-6 py-3 rounded-lg shadow hover:bg-[#C4B192] transition"
      >
        Sign In
      </a>
    </div>
  );
  if (loading) return <Loading />

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Favorite Recipes</h1>

      {favorites.length === 0 && <p>No saved recipes yet.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {favorites.map((fav, index) => (
          <div key={fav.recipe_id} className="flex flex-col w-full bg-white shadow-md hover:shadow-lg rounded-xl">
            <RecipeCardContent
              recipe={fav.recipe}
              priority={index === 0}
              onFavoriteChange={() => {
                const refresh = async () => {
                  const { data } = await supabase
                    .from("favorites")
                    .select("*")
                    .eq("user_id", user.id);
                  setFavorites(data ?? []);
                };
                refresh();
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
