"use client";

import { useState, useEffect } from "react";
import RecipeCardContent from "./components/RecipeCardContent";
import Loading from "./loading";
import Filters from "./components/Filters";

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(8);
  const [isLoading, setIsLoading] = useState(true);

  const [ratingFilter, setRatingFilter] = useState("All");
  const [prepTimeFilter, setPrepTimeFilter] = useState("All");

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/Ovi/DummyJSON/master/database/recipes.json")
      .then(res => res.json())
      .then(data => {
        setRecipes(Array.isArray(data) ? data : data.recipes || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const filteredRecipes = recipes
    .filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    .filter(r => {
      if (ratingFilter === "All") return true;
      if (ratingFilter === "5") return r.rating === 5;
      if (ratingFilter === "4") return r.rating >= 4;
      if (ratingFilter === "3") return r.rating >= 3;
      if (ratingFilter === "2") return r.rating >= 2;
      return true;
    })
    .filter(r => {
      if (prepTimeFilter === "All") return true;
      return r.prepTimeMinutes <= Number(prepTimeFilter);
    })
    .slice(0, offset);

  if (isLoading) return <Loading />;

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full min-h-[200px] px-4 md:px-10">
        <h1 className="text-black text-6xl mb-3">
          <p className="text-black text-4xl text-bold">
            <span className="text-[#5B3705]">C</span>
            <span className="text-[#6E5430]">o</span>
            <span className="text-[#6E5430]">o</span>
            <span className="text-[#5B3705]">ksy</span>
          </p>
        </h1>

        <p className="text-center text-gray-700 max-w-xl hidden md:block">
          Delicious ideas, simple steps and flavors that inspire every meal.
        </p>
        <input
          type="text"
          placeholder="Search"
          className="pl-10 w-[500px] h-14 border border-gray-300 bg-white mt-6 rounded-full shadow-md hidden md:block"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
       <div className="w-full max-w-[1600px] mx-auto">
        <Filters
          ratingFilter={ratingFilter}
          setRatingFilter={setRatingFilter}
          prepTimeFilter={prepTimeFilter}
          setPrepTimeFilter={setPrepTimeFilter}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 px-4 sm:px-6 md:px-10">
          {filteredRecipes.map((recipe, index) => (
            <div
              key={recipe.id}
              className="flex flex-col w-full bg-white shadow-md hover:shadow-lg rounded-xl"
            >
              <RecipeCardContent recipe={recipe} priority={index === 0} />
            </div>
          ))}
        </div>

        <div className="flex justify-center my-6">
          {offset < recipes.length && (
            <button
              onClick={() => setOffset(prev => prev + 8)}
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
