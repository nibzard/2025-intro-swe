<<<<<<< HEAD
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.js file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
=======
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
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
  );
}
